import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROVIDERS = [
  {
    id: "doordash-drive",
    name: "DoorDash Drive",
    type: "Gig Network",
    estimated_cost: "$7.20",
    on_time_rate: "88%",
    failure_rate: "6%",
    coverage: "High — Urban & Suburban",
    avg_pickup_eta: "8 min",
    current_load: "Medium",
    capabilities: {
      chain_of_custody: false,
      age_verification: true,
      temperature_control: false,
      medical_certified: false,
      max_weight_lbs: 30,
    },
    strengths: "Broad urban coverage, fast pickup",
    weaknesses: "No chain of custody, gig workforce reliability varies at peak",
  },
  {
    id: "uber-direct",
    name: "Uber Direct",
    type: "Gig Network",
    estimated_cost: "$8.10",
    on_time_rate: "91%",
    failure_rate: "5%",
    coverage: "High — Urban & Suburban",
    avg_pickup_eta: "6 min",
    current_load: "High",
    capabilities: {
      chain_of_custody: false,
      age_verification: true,
      temperature_control: false,
      medical_certified: false,
      max_weight_lbs: 30,
    },
    strengths: "Slightly higher reliability than DoorDash, fast ETA",
    weaknesses: "Currently high load in zone, no chain of custody",
  },
  {
    id: "shipt",
    name: "Shipt",
    type: "Grocery & Pharmacy Specialist",
    estimated_cost: "$11.40",
    on_time_rate: "93%",
    failure_rate: "4%",
    coverage: "Medium-High",
    avg_pickup_eta: "12 min",
    current_load: "Low",
    capabilities: {
      chain_of_custody: false,
      age_verification: true,
      temperature_control: true,
      medical_certified: false,
      max_weight_lbs: 40,
    },
    strengths: "Strong pharmacy focus, W2 workers, temperature control capable",
    weaknesses: "No formal chain of custody documentation",
  },
  {
    id: "dropoff",
    name: "Dropoff",
    type: "Medical & Professional Courier",
    estimated_cost: "$26.50",
    on_time_rate: "98%",
    failure_rate: "1%",
    coverage: "Medium — Major metros",
    avg_pickup_eta: "15 min",
    current_load: "Low",
    capabilities: {
      chain_of_custody: true,
      age_verification: true,
      temperature_control: true,
      medical_certified: true,
      max_weight_lbs: 50,
    },
    strengths: "Certified medical couriers, full chain of custody, highest reliability",
    weaknesses: "Premium cost, slower pickup, limited coverage outside major metros",
  },
  {
    id: "veho",
    name: "Veho",
    type: "Regional Carrier — West Coast",
    estimated_cost: "$8.80",
    on_time_rate: "95%",
    failure_rate: "3%",
    coverage: "Medium — West Coast strong",
    avg_pickup_eta: "10 min",
    current_load: "Low",
    capabilities: {
      chain_of_custody: false,
      age_verification: false,
      temperature_control: false,
      medical_certified: false,
      max_weight_lbs: 35,
    },
    strengths: "W2 drivers, strong reliability, good West Coast coverage",
    weaknesses: "No age verification, no chain of custody, not medical-certified",
  },
  {
    id: "roadie",
    name: "Roadie (UPS)",
    type: "Crowd-Sourced / UPS Network",
    estimated_cost: "$9.30",
    on_time_rate: "89%",
    failure_rate: "7%",
    coverage: "High — National",
    avg_pickup_eta: "20 min",
    current_load: "Low",
    capabilities: {
      chain_of_custody: false,
      age_verification: false,
      temperature_control: false,
      medical_certified: false,
      max_weight_lbs: 150,
    },
    strengths: "Best for large/heavy items, UPS-backed national coverage",
    weaknesses: "Slowest pickup, not suitable for medical or controlled substances",
  },
];

const SYSTEM_PROMPT = `You are Pulse AI, the platform's real-time provider selection engine. You analyze incoming delivery orders and select the optimal provider from the available network.

Reason through the order using exactly these five steps, using exactly these headers:

**STEP 1: ORDER ANALYSIS**
Identify the order type, critical requirements, constraints, and any non-negotiable capabilities the provider must have. Be specific about what matters most for this order.

**STEP 2: HARD FILTERS**
List which providers are eliminated immediately based on capability gaps. Name each eliminated provider and state exactly why they cannot handle this order.

**STEP 3: PROVIDER EVALUATION**
For each remaining provider, evaluate them on: capability fit, cost efficiency, reliability for this order type, and current availability. Be specific and cite the data.

**STEP 4: RANKING**
Rank the viable providers from best to worst for this specific order. Show the trade-offs clearly. No hedging.

**STEP 5: RECOMMENDATION**
State the selected provider clearly. Include: estimated cost, expected on-time probability, pickup ETA, and a one-sentence rationale. End with: SELECTED: [Provider Name]

Be decisive. Use the provider data. Show your reasoning clearly.`;

export async function POST(req) {
  const { order } = await req.json();

  const userPrompt = `New order received from Safeway:

ORDER DETAILS:
${JSON.stringify(order, null, 2)}

AVAILABLE PROVIDERS:
${JSON.stringify(PROVIDERS, null, 2)}

Analyze this order and select the optimal delivery provider.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
