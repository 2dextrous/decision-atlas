// The map: zones, lines and stations.
// Lines are organized by planning horizon (Plan, Design, Run, Protect) plus a toolkit and SAP.

export type Tone =
  | 'demand' | 'inventory' | 'supply' | 'network' | 'sourcing' | 'logistics' | 'orders' | 'risk'
  | 'foundations' | 'analytics' | 'sap';

export type ZoneId = 'start' | 'plan' | 'design' | 'run' | 'protect' | 'execute';

export interface Stop {
  slug: string;
  /** Name as shown on this line (an interchange can carry a different name per line). */
  label: string;
  summary: string;
}

export interface Line {
  id: string;
  code: string;
  name: string;
  tone: Tone;
  zone: ZoneId;
  tagline: string;
  stops: Stop[];
}

export interface Zone {
  id: ZoneId;
  title: string;
  horizon?: string;
  blurb: string;
}

export interface Station {
  slug: string;
  name: string;
  summary: string;
  /** Primary line: decides the URL. */
  line: string;
  /** Every line this station sits on, primary first. */
  lines: string[];
}

export const zones: Zone[] = [
  { id: 'start', title: 'Start here', blurb: 'The vocabulary, KPIs and analytical tools every other line builds on.' },
  { id: 'plan', title: 'Plan', horizon: 'Months ahead', blurb: 'Forecast demand, size inventory and turn both into a supply plan.' },
  { id: 'design', title: 'Design', horizon: 'Years ahead', blurb: 'Long-term choices about where facilities sit and who supplies them.' },
  { id: 'run', title: 'Run', horizon: 'Days to weeks', blurb: 'Moving goods and keeping promises to customers, every day.' },
  { id: 'protect', title: 'Protect', horizon: 'Always on', blurb: 'Cost, risk and sustainability decisions that guard the whole chain.' },
  { id: 'execute', title: 'Execute in SAP', blurb: 'How the ideas on this map run inside an ERP, transaction by transaction.' },
];

const s = (slug: string, label: string, summary: string): Stop => ({ slug, label, summary });

export const lines: Line[] = [
  {
    id: 'foundations', code: 'FND', name: 'Foundations', tone: 'foundations', zone: 'start',
    tagline: 'What a supply chain is, how it competes, and how it is measured.',
    stops: [
      s('what-is-a-supply-chain', 'What a supply chain is', 'Flows, stages and the push–pull boundary.'),
      s('strategic-fit', 'Strategy & strategic fit', 'Matching the supply chain to what customers value: efficient or responsive.'),
      s('bullwhip-effect', 'The bullwhip effect', 'Why small wobbles in demand turn into big swings upstream.'),
      s('supply-chain-kpis', 'Supply chain KPIs', 'OTIF, fill rate, inventory turns and perfect order, and how they trade off.'),
      s('cash-conversion-cycle', 'Cash conversion cycle', 'How long cash stays tied up in operations: DIO + DSO − DPO.'),
      s('lean-six-sigma-toc', 'Lean, Six Sigma & TOC', 'Removing waste, variation and constraints.'),
      s('incoterms', 'Incoterms', 'Who pays and who carries the risk at each leg of an international shipment.'),
    ],
  },
  {
    id: 'analytics', code: 'ANL', name: 'Analytics & AI', tone: 'analytics', zone: 'start',
    tagline: 'The statistics, optimization and AI behind every decision on the map.',
    stops: [
      s('statistics-toolkit', 'Statistics you will actually use', 'Variability, box plots, outliers and stationarity.'),
      s('optimization-basics', 'Optimization basics: LP and MILP', 'Objective, decision variables and constraints in plain words.'),
      s('simulation', 'Simulation & Monte Carlo', 'Testing a decision against thousands of possible futures.'),
      s('ml-in-supply-chain', 'Machine learning in supply chain', 'Where ML helps, from forecasting to ETA prediction, and where it does not.'),
      s('ai-agents', 'AI agents, RAG & copilots', 'What an agent is: a language model with tools, memory and a goal.'),
      s('ai-plus-optimization', 'AI + optimization', 'Why prediction and optimization are stronger together.'),
    ],
  },
  {
    id: 'demand', code: 'DEM', name: 'Demand', tone: 'demand', zone: 'plan',
    tagline: 'What customers will want, when, and how sure we can be.',
    stops: [
      s('forecasting-fundamentals', 'Forecasting fundamentals', 'Level, trend, seasonality and noise; horizons and granularity.'),
      s('demand-patterns', 'Demand patterns & classification', 'Smooth, erratic, intermittent or lumpy: classify before you forecast.'),
      s('exponential-smoothing', 'Exponential smoothing & ETS', 'SES, Holt, damped trend and Holt-Winters: one idea underneath.'),
      s('intermittent-demand', 'Intermittent demand: Croston, SBA, TSB', 'Forecasting spare parts and slow movers that sell in bursts.'),
      s('ml-forecasting', 'ML & global forecasting models', 'Gradient boosting, deep learning and foundation models across many series.'),
      s('forecast-accuracy', 'Forecast accuracy & bias', 'MAPE, WMAPE, MASE, bias and tracking signal, and when each misleads.'),
      s('probabilistic-forecasting', 'Probabilistic forecasting', 'Forecasting a range and its quantiles instead of one number.'),
      s('hierarchical-forecasting', 'Hierarchical forecasting', 'Making SKU, region and total forecasts add up: bottom-up, top-down, MinT.'),
      s('promotions-cannibalization', 'Promotions, cannibalization & halo', 'Estimating promotional lift and its side effects on other products.'),
      s('lifecycle-forecasting', 'New products & phase-outs', 'Forecasting launches with no history, and running products down cleanly.'),
      s('demand-sensing-shaping', 'Demand sensing & shaping', 'Reading short-term signals, and steering demand toward supply.'),
      s('consensus-fva', 'Consensus forecasting & FVA', 'Letting human judgment in only where it adds value.'),
    ],
  },
  {
    id: 'inventory', code: 'INV', name: 'Inventory', tone: 'inventory', zone: 'plan',
    tagline: 'How much stock to hold, where to hold it, and what it protects you from.',
    stops: [
      s('why-inventory', 'Why inventory exists', 'Cycle, safety, pipeline and anticipation stock, and what each costs.'),
      s('eoq', 'How much to order: EOQ', 'Balancing ordering and holding cost, with discounts and gradual production.'),
      s('safety-stock', 'Safety stock & reorder points', 'How big a buffer to hold, when to reorder, and how to say it in days of supply.'),
      s('service-levels', 'Service levels: CSL vs fill rate', 'Two meanings of “95% service”, and why the gap matters.'),
      s('newsvendor', 'The newsvendor model', 'One-shot orders for perishables, fashion and events.'),
      s('inventory-segmentation', 'Inventory segmentation (ABC-XYZ)', 'Different policies for different items, not one blanket rule.'),
      s('risk-pooling', 'Risk pooling & centralization', 'Why combining stock points shrinks the total buffer.'),
      s('meio', 'Multi-echelon inventory (MEIO)', 'Placing buffers across plant, warehouse and store as one system.'),
      s('drp-deployment', 'Replenishment & deployment (DRP)', 'When each warehouse reorders, and where available stock should go.'),
      s('slow-obsolete', 'Slow-moving & obsolete stock', 'Spotting dead stock early and choosing the least costly exit.'),
      s('postponement', 'Postponement', 'Holding generic stock and customizing it late.'),
    ],
  },
  {
    id: 'supply', code: 'SUP', name: 'Supply & production', tone: 'supply', zone: 'plan',
    tagline: 'Turning the demand plan into production and purchase plans that fit capacity.',
    stops: [
      s('planning-hierarchy', 'The planning hierarchy', 'Strategic, tactical and operational plans, and how they hand off.'),
      s('sop-ibp', 'S&OP and IBP', 'The monthly cycle where sales, supply and finance agree on one plan.'),
      s('mps', 'Master production scheduling', 'How many finished goods to make, week by week.'),
      s('mrp', 'MRP: from BOM to orders', 'Exploding the plan into component and material requirements.'),
      s('rccp', 'Rough-cut capacity check', 'Testing whether the plan fits the bottleneck before committing.'),
      s('plant-allocation', 'Multi-plant allocation', 'Which plant should make how much of each product.'),
      s('production-scheduling', 'Scheduling & sequencing', 'The order of jobs on each line, hour by hour.'),
      s('changeovers', 'Changeovers & lot sizing', 'Shorter switches between products, and smarter run lengths.'),
      s('oee', 'OEE & line performance', 'Availability × performance × quality, and what drags each one down.'),
      s('bottlenecks', 'Bottlenecks & debottlenecking', 'Finding the constraint, then lifting it.'),
      s('maintenance-planning', 'Maintenance planning', 'Planned stops that prevent unplanned ones.'),
      s('workforce-planning', 'Workforce planning & shifts', 'The right people, with the right skills, on the right shift.'),
    ],
  },
  {
    id: 'network', code: 'NET', name: 'Network design', tone: 'network', zone: 'design',
    tagline: 'Where plants and warehouses should sit, how big they should be, and who serves whom.',
    stops: [
      s('network-design-decisions', 'What network design decides', 'Facility roles, locations, capacities and who serves whom.'),
      s('distribution-designs', 'Six distribution network designs', 'From drop-shipping to store pickup: who stores and who delivers.'),
      s('facility-location', 'Facility location models', 'Center of gravity, p-median and fixed-charge models.'),
      s('greenfield', 'Greenfield studies', 'Designing a network from a blank map.'),
      s('manufacturing-footprint', 'Manufacturing footprint & plant roles', 'Which plants make what, and the role each one plays.'),
      s('channel-design', 'Channel design & omnichannel', 'Serving stores, web and distributors from one network.'),
      s('cross-docking', 'Cross-docking vs stocking', 'Flow goods straight through a hub, or store them first?'),
      s('postponement', 'Postponement in the network', 'Holding generic stock and customizing it late.'),
      s('reverse-logistics', 'Reverse logistics networks', 'Collecting, inspecting and recovering returned goods.'),
      s('carbon-aware-design', 'Carbon-aware network design', 'Treating emissions as a cost or a constraint.'),
      s('scenario-modeling', 'Scenario modeling & digital twins', 'Stress-testing a design before you build it.'),
    ],
  },
  {
    id: 'sourcing', code: 'SRC', name: 'Sourcing & procurement', tone: 'sourcing', zone: 'design',
    tagline: 'Who you buy from, how you split the volume, and the terms that share the risk.',
    stops: [
      s('procurement-fundamentals', 'Procurement fundamentals', 'From need to payment: the purchasing cycle and its controls.'),
      s('kraljic', 'Kraljic matrix & category strategy', 'Different buying strategies for different spend categories.'),
      s('supplier-selection', 'Supplier selection & TCO', 'Scorecards, total cost of ownership and the cheapest-price trap.'),
      s('sourcing-allocation', 'Single, dual or multi-sourcing', 'How many suppliers to use, and how to split the volume.'),
      s('supplier-network', 'Supplier network design', 'Which supplier sites should feed which plants.'),
      s('contracts', 'Contracts & negotiation', 'Volume, price and flexibility terms that share risk.'),
      s('make-vs-buy', 'Make vs buy & contract manufacturing', 'When to outsource, and how much volume to give co-packers.'),
      s('commodity-hedging', 'Commodity price risk & hedging', 'Locking in input prices to limit cost swings.'),
      s('supplier-risk', 'Supplier risk & n-tier visibility', 'Seeing risks beyond your direct suppliers.'),
    ],
  },
  {
    id: 'logistics', code: 'LOG', name: 'Logistics & transportation', tone: 'logistics', zone: 'run',
    tagline: 'Moving and storing goods at the lowest cost that still keeps the delivery promise.',
    stops: [
      s('transport-fundamentals', 'Transportation fundamentals', 'Modes, FTL vs LTL, and what drives freight cost.'),
      s('transport-planning', 'Transport planning & TMS', 'Turning orders into shipments, loads and routes.'),
      s('lane-mode', 'Lane & mode optimization', 'The best mode and carrier mix for each lane.'),
      s('load-building', 'Load building & consolidation', 'Fuller trucks, fewer trips.'),
      s('carrier-procurement', 'Carrier selection & freight tenders', 'Which carrier gets each lane, and at what rate.'),
      s('vehicle-routing', 'Vehicle routing & last mile', 'Routing deliveries to doors: the vehicle routing problem in practice.'),
      s('fleet-sizing', 'Fleet sizing & mix', 'How many vehicles of which type to own or lease.'),
      s('intermodal', 'Intermodal & drayage', 'Moving containers between port, rail and road.'),
      s('warehousing', 'Warehousing & throughput', 'Slotting, picking and getting more orders out of the same building.'),
      s('eta-visibility', 'ETA prediction & shipment visibility', 'Knowing when an order will really arrive.'),
    ],
  },
  {
    id: 'orders', code: 'ORD', name: 'Orders & service', tone: 'orders', zone: 'run',
    tagline: 'Promising, allocating and delivering orders, and handling what comes back.',
    stops: [
      s('order-to-delivery', 'Order to delivery basics', 'What happens between an order and the customer’s doorstep.'),
      s('atp-ctp', 'Order promising: ATP & CTP', 'What you can promise from stock, or make in time.'),
      s('allocation', 'Allocation when supply is short', 'Deciding who gets scarce stock, and by which rules.'),
      s('substitution', 'Substitution', 'Offering the next-best product when an item is out.'),
      s('control-tower', 'Control tower & S&OE', 'Spotting and fixing this week’s exceptions fast.'),
      s('order-visibility', 'Order visibility & analytics', 'Tracking orders live to catch delays early.'),
      s('returns', 'Returns management', 'Deciding quickly what happens to each return.'),
      s('service-parts', 'Service parts planning', 'Stocking spares when demand is sparse and lumpy.'),
      s('service-copilots', 'AI in customer service', 'Copilots that answer “where is my order?”'),
    ],
  },
  {
    id: 'risk', code: 'RSK', name: 'Risk, cost & sustainability', tone: 'risk', zone: 'protect',
    tagline: 'What each customer really costs, how the chain survives shocks, and its footprint.',
    stops: [
      s('cost-to-serve', 'Cost-to-serve', 'What each customer, channel or order really costs.'),
      s('segmentation-strategy', 'Supply chain segmentation', 'Running different supply chains for different products and customers.'),
      s('service-level-policy', 'Service level policy', 'Setting service targets by segment, based on economics.'),
      s('scenario-planning', 'Scenario planning', 'Planning for several possible futures instead of one.'),
      s('resilience', 'Resilience: time to recover & survive', 'How long the network can absorb a shock, and how fast it recovers.'),
      s('tariffs-trade', 'Tariffs, trade & compliance', 'How duties and trade rules reshape sourcing and the network.'),
      s('esg-risk', 'Climate & ESG risk', 'Exposure to climate events and ESG requirements.'),
      s('sustainable-optimization', 'Sustainable optimization', 'Trading off cost, service and emissions in one model.'),
      s('regulatory-compliance', 'Regulatory compliance', 'Industry rules the supply chain must follow.'),
    ],
  },
  {
    id: 'sap', code: 'SAP', name: 'SAP in practice', tone: 'sap', zone: 'execute',
    tagline: 'How the ideas on this map run inside SAP, transaction by transaction.',
    stops: [
      s('sap-basics', 'SAP & S/4HANA basics', 'ERP, organizational structure and master data: the vocabulary.'),
      s('demand-planning-in-sap', 'Demand planning in SAP', 'How the forecasting ideas show up in SAP IBP.'),
      s('inventory-mrp-in-sap', 'Inventory & MRP in SAP', 'Safety stock, reorder points and MRP types in the material master.'),
      s('procure-to-pay', 'Procure to pay (MM)', 'From requisition to payment: ME51N to F110.'),
      s('plan-to-produce', 'Plan to produce (PP)', 'BOMs, routings, MRP runs and production orders.'),
      s('warehouse-in-sap', 'Warehouse (WM / EWM)', 'Bins, transfer orders and putaway in practice.'),
      s('order-to-cash', 'Order to cash (SD)', 'From sales order to customer payment: VA01 to F-28.'),
      s('record-to-report', 'Record to report (FI/CO)', 'Where every logistics step lands in the books.'),
      s('sap-process-map', 'End-to-end process map', 'One order traced across every module, interactively.'),
      s('sap-interview-questions', 'SAP interview questions', 'The questions SAP functional interviews actually ask.'),
    ],
  },
];

export const lineById = new Map(lines.map((l) => [l.id, l]));

export const stations: Map<string, Station> = (() => {
  const map = new Map<string, Station>();
  for (const line of lines) {
    for (const stop of line.stops) {
      const existing = map.get(stop.slug);
      if (existing) existing.lines.push(line.id);
      else map.set(stop.slug, { slug: stop.slug, name: stop.label, summary: stop.summary, line: line.id, lines: [line.id] });
    }
  }
  return map;
})();

export const stationUrl = (slug: string) => {
  const st = stations.get(slug);
  if (!st) throw new Error(`Unknown station: ${slug}`);
  return `/${st.line}/${slug}/`;
};

export const linesInZone = (zone: ZoneId) => lines.filter((l) => l.zone === zone);

export interface PrepPath {
  id: string;
  title: string;
  who: string;
  stops: string[];
}

export const prepPaths: PrepPath[] = [
  {
    id: 'analytics', title: 'Supply chain analytics & planning', who: 'Planning software firms and analytics teams',
    stops: ['forecasting-fundamentals', 'demand-patterns', 'forecast-accuracy', 'safety-stock', 'meio', 'sop-ibp', 'facility-location', 'ai-plus-optimization'],
  },
  {
    id: 'consulting', title: 'Supply chain consulting', who: 'Strategy and operations consulting',
    stops: ['strategic-fit', 'supply-chain-kpis', 'cash-conversion-cycle', 'distribution-designs', 'sop-ibp', 'cost-to-serve', 'segmentation-strategy', 'resilience'],
  },
  {
    id: 'sap', title: 'SAP functional (MM, SD, PP)', who: 'SAP consulting and ERP roles',
    stops: ['sap-basics', 'procure-to-pay', 'order-to-cash', 'plan-to-produce', 'inventory-mrp-in-sap', 'record-to-report', 'sap-process-map', 'sap-interview-questions'],
  },
  {
    id: 'operations', title: 'Operations & manufacturing', who: 'Plant, FMCG and manufacturing roles',
    stops: ['mps', 'mrp', 'rccp', 'oee', 'bottlenecks', 'changeovers', 'maintenance-planning', 'lean-six-sigma-toc'],
  },
];
