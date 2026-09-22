import type { SampleDatasetDefinition } from '@/types';

export const SAMPLE_DATASETS: SampleDatasetDefinition[] = [
  {
    id: 'ecommerce_transactions',
    name: 'E-commerce Transactions',
    tableName: 'ecommerce_orders',
    category: 'Fintech',
    description: '120+ order records with category breakdowns, customer geography, and revenue margins.',
    rowCountEstimated: 120,
    suggestedSql: `SELECT 
  category,
  COUNT(*) AS total_orders,
  ROUND(SUM(total_amount), 2) AS total_revenue,
  ROUND(AVG(total_amount), 2) AS avg_order_value,
  ROUND(AVG(discount_pct), 1) AS avg_discount
FROM ecommerce_orders
WHERE payment_status = 'completed'
GROUP BY category
ORDER BY total_revenue DESC;`,
    dataGenerator: () => {
      const categories = [
        { cat: 'Electronics', items: ['Mechanical Keyboard', 'Studio Headphones', '4K Monitor', 'USB-C Hub', 'Gaming Mouse'], priceRange: [45, 650] },
        { cat: 'Furniture', items: ['Standing Desk', 'Ergonomic Chair', 'Monitor Arm', 'Desk Mat', 'Cable Raceway'], priceRange: [30, 480] },
        { cat: 'Apparel', items: ['Developer Hoodie', 'Merino Wool Tee', 'Canvas Backpack', 'Tech Cargo Pants'], priceRange: [25, 120] },
        { cat: 'Accessories', items: ['Anker Power Bank', 'YubiKey 5C', 'Webcam Light', 'Cleaning Gel'], priceRange: [15, 85] },
      ];
      const countries = ['ID', 'US', 'SG', 'JP', 'DE', 'GB', 'AU', 'NL'];
      const segments = ['Consumer', 'SMB', 'Enterprise'];
      const statuses = ['completed', 'completed', 'completed', 'refunded', 'pending'];

      const records: Record<string, unknown>[] = [];
      const baseDate = new Date('2024-01-01T08:00:00Z').getTime();

      for (let i = 1; i <= 120; i++) {
        const catObj = categories[i % categories.length];
        const item = catObj.items[i % catObj.items.length];
        const qty = (i % 4) + 1;
        const unitPrice = parseFloat((catObj.priceRange[0] + (i * 17) % (catObj.priceRange[1] - catObj.priceRange[0])).toFixed(2));
        const discountPct = (i % 5 === 0) ? 15 : (i % 3 === 0) ? 10 : 0;
        const subtotal = qty * unitPrice;
        const totalAmount = parseFloat((subtotal * (1 - discountPct / 100)).toFixed(2));
        const dateOffset = i * 28 * 60 * 60 * 1000 + (i % 12) * 3600000;
        const orderDate = new Date(baseDate + dateOffset).toISOString();

        records.push({
          order_id: `ORD-${String(10000 + i)}`,
          customer_id: `CUST-${String(200 + (i % 45))}`,
          customer_segment: segments[i % segments.length],
          country: countries[i % countries.length],
          category: catObj.cat,
          item_name: item,
          quantity: qty,
          unit_price: unitPrice,
          discount_pct: discountPct,
          total_amount: totalAmount,
          payment_status: statuses[i % statuses.length],
          created_at: orderDate,
        });
      }
      return records;
    },
  },
  {
    id: 'server_access_logs',
    name: 'Server Access Logs',
    tableName: 'server_logs',
    category: 'DevOps',
    description: '150 edge gateway HTTP request logs with status codes, endpoints, and latency metrics.',
    rowCountEstimated: 150,
    suggestedSql: `SELECT 
  method,
  endpoint,
  COUNT(*) AS request_count,
  ROUND(AVG(latency_ms), 1) AS avg_latency_ms,
  MAX(latency_ms) AS max_latency_ms,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS error_count
FROM server_logs
GROUP BY method, endpoint
ORDER BY request_count DESC;`,
    dataGenerator: () => {
      const endpoints = [
        { path: '/api/v1/auth/login', method: 'POST', baseLatency: 120 },
        { path: '/api/v1/workspaces', method: 'GET', baseLatency: 45 },
        { path: '/api/v1/queries/execute', method: 'POST', baseLatency: 280 },
        { path: '/api/v1/datasets/upload', method: 'POST', baseLatency: 350 },
        { path: '/api/v1/health', method: 'GET', baseLatency: 12 },
        { path: '/api/v1/metrics', method: 'GET', baseLatency: 65 },
        { path: '/api/v1/schema', method: 'GET', baseLatency: 35 },
      ];
      const statusCodes = [200, 200, 200, 201, 200, 304, 400, 401, 404, 500];
      const countries = ['ID', 'US', 'SG', 'JP', 'DE', 'FR', 'NL'];
      const userAgents = ['InSituSQL-Client/1.0', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'curl/8.4.0'];

      const records: Record<string, unknown>[] = [];
      const baseDate = new Date('2024-03-15T00:00:00Z').getTime();

      for (let i = 1; i <= 150; i++) {
        const ep = endpoints[i % endpoints.length];
        const status = (i % 25 === 0) ? 500 : (i % 17 === 0) ? 404 : (i % 11 === 0) ? 401 : statusCodes[i % statusCodes.length];
        const latency = Math.max(8, ep.baseLatency + ((i * 37) % 180) - 40);
        const bytes = (status >= 400) ? 142 : 1024 + ((i * 123) % 8192);
        const timestamp = new Date(baseDate + i * 180000).toISOString();

        records.push({
          log_id: `LOG-${String(i).padStart(5, '0')}`,
          timestamp,
          ip_address: `192.168.${(i % 16) + 1}.${(i * 13) % 254 + 1}`,
          method: ep.method,
          endpoint: ep.path,
          status_code: status,
          latency_ms: latency,
          bytes_sent: bytes,
          geo_country: countries[i % countries.length],
          user_agent: userAgents[i % userAgents.length],
        });
      }
      return records;
    },
  },
  {
    id: 'saas_subscriptions',
    name: 'SaaS Subscriptions',
    tableName: 'saas_accounts',
    category: 'SaaS Analytics',
    description: '100 B2B enterprise client accounts with recurring revenue, seat usage, and churn status.',
    rowCountEstimated: 100,
    suggestedSql: `SELECT 
  plan_tier,
  COUNT(*) AS accounts,
  SUM(mrr) AS total_mrr,
  ROUND(AVG(seat_count), 0) AS avg_seats,
  ROUND(AVG(health_score), 1) AS avg_health,
  ROUND(100.0 * SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) / COUNT(*), 1) AS churn_rate_pct
FROM saas_accounts
GROUP BY plan_tier
ORDER BY total_mrr DESC;`,
    dataGenerator: () => {
      const companies = [
        'Acme Corp', 'Stripeworks', 'CloudScale Inc', 'DataMesh Labs', 'Vertex AI',
        'FinFlow Global', 'NextGen Logistics', 'HyperDrive Systems', 'OmniPlatform',
        'PulseHealth', 'AeroDynamics', 'CyberShield Security', 'Beacon Analytics',
        'QuantumLeap', 'SilverLine Media', 'NorthStar Retail', 'BlueOcean SaaS',
        'Zenith Financial', 'Frontier Robotics', 'Krypton Networks'
      ];
      const tiers = [
        { name: 'Starter', pricePerSeat: 29 },
        { name: 'Professional', pricePerSeat: 79 },
        { name: 'Enterprise', pricePerSeat: 149 },
      ];
      const industries = ['Fintech', 'Healthcare', 'Logistics', 'Security', 'E-commerce', 'Media'];

      const records: Record<string, unknown>[] = [];
      const baseDate = new Date('2023-01-10T00:00:00Z').getTime();

      for (let i = 1; i <= 100; i++) {
        const company = `${companies[i % companies.length]} #${Math.floor(i / companies.length) + 1}`;
        const tier = tiers[i % tiers.length];
        const seats = tier.name === 'Enterprise' ? 25 + (i * 7) % 250 : tier.name === 'Professional' ? 10 + (i * 3) % 40 : 2 + (i % 8);
        const mrr = seats * tier.pricePerSeat;
        const signupDate = new Date(baseDate + i * 4 * 24 * 3600000).toISOString().split('T')[0];
        const isChurned = i % 14 === 0;
        const healthScore = isChurned ? Math.max(20, 45 - (i % 25)) : Math.min(99, 70 + (i * 11) % 29);

        records.push({
          account_id: `ACC-${String(1000 + i)}`,
          company_name: company,
          industry: industries[i % industries.length],
          plan_tier: tier.name,
          seat_count: seats,
          mrr: mrr,
          signup_date: signupDate,
          is_churned: isChurned,
          health_score: healthScore,
        });
      }
      return records;
    },
  },
];
