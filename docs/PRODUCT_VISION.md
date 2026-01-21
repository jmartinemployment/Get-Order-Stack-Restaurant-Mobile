# OrderStack: Product Vision Document
## "The Restaurant Operating System Built for Independents"

---

## Executive Summary

OrderStack is a modular, AI-native restaurant operating system designed to compete with Toast, Square, and other incumbent solutions. Built with empathy for independent restaurant operators, OrderStack offers transparent pricing, offline-first reliability, and intelligent automation that helps restaurants understand and optimize their operations.

**Tagline Options:**
- "Run your restaurant, not your software"
- "The restaurant OS that works as hard as you do"
- "Finally, software that speaks restaurant"

---

## The Problem

### Independent restaurants are being squeezed from all sides:

**By Technology Vendors:**
- Toast charges $0+ to $165+/month PLUS 2.49-2.99% per transaction
- Proprietary hardware locks them in ($799+ for terminals)
- Features they don't need bundled with features they do
- Clunky interfaces designed by engineers, not restaurant people

**By Delivery Platforms:**
- DoorDash/UberEats take 15-30% commission
- Restaurants lose control of customer relationship
- Data about their own customers held hostage

**By Their Own Operations:**
- 60% of restaurants fail within 5 years
- Food cost creep goes unnoticed until it's too late
- Labor scheduling is still done on paper or WhatsApp
- They don't know if they're profitable until the accountant tells them

**By Lack of Time:**
- Owners work 60-80 hour weeks
- No time to learn complex software
- No time to analyze data, even if they had it
- Decisions made on gut feel, not insight

---

## The Solution

### OrderStack is different:

| Incumbent Approach | OrderStack Approach |
|-------------------|---------------------|
| Sell hardware at markup | BYOD - bring your own device |
| Bundle everything | Pay only for modules you use |
| Complex training required | Intuitive UX, works in 5 minutes |
| Cloud-dependent | Offline-first, always works |
| Reports you have to read | AI insights that tell you what to do |
| Hidden fees | Transparent, predictable pricing |
| Generic software | Built for restaurants, by people who listen |

---

## Target Customer

### Primary: Independent Fast Casual Restaurants

**Profile:**
- 1-3 locations
- $500K - $3M annual revenue
- 10-30 employees
- Owner-operated or small management team
- Currently using Toast, Square, Clover, or cobbled-together solutions

**Why Fast Casual First:**
- Simpler operations than fine dining
- Higher volume than cafes (more transactions = more value)
- Tech-forward customers (QR codes acceptable)
- Underserved by current solutions (too small for enterprise, too complex for Square)

### Secondary: Family-Owned Full Service

**Profile:**
- Single location, family-operated
- Strong community ties
- Often immigrant-owned (language considerations)
- Resistant to technology that feels "cold"

**Why Secondary:**
- Longer sales cycle
- More relationship-based
- But: extremely loyal once won

---

## Product Principles

### 1. Empathy-Driven UX
Every screen asks: "Would a tired restaurant owner at 11pm understand this instantly?"

### 2. Offline-First
Internet goes down during dinner rush? OrderStack keeps working. Syncs when connection returns.

### 3. AI-Native, Not AI-Bolted
AI isn't a feature - it's the foundation. Every module learns and recommends.

### 4. Modular Everything
Start with POS. Add inventory when ready. Never pay for features you don't use.

### 5. Transparent Pricing
No hidden fees. No surprise charges. Know exactly what you'll pay.

### 6. Data Belongs to You
Export anything, anytime. We don't hold your data hostage.

---

## Module Roadmap

### Phase 1: Foundation (Current → 3 months)
*Goal: Working system that can run a restaurant*

| Module | Status | Description |
|--------|--------|-------------|
| **POS** | 🟡 In Progress | Order taking, checkout, payments |
| **KDS** | 🟡 In Progress | Kitchen display system |
| **Menu Management** | 🟢 Backend Ready | Categories, items, modifiers, pricing |
| **Order Management** | 🟢 Backend Ready | Order lifecycle, status tracking |
| **Basic Reporting** | 🔴 Not Started | Daily sales, item mix, basic dashboards |
| **Online Ordering** | 🔴 Not Started | Customer-facing ordering (pickup focus) |

**Phase 1 Exit Criteria:**
- [ ] Can take a dine-in order on POS
- [ ] Order appears on KDS
- [ ] Kitchen can bump order through stages
- [ ] Receipt prints
- [ ] Can view day's sales
- [ ] Customer can order online for pickup

---

### Phase 2: Intelligence (3-6 months)
*Goal: System that helps you understand your business*

| Module | Description |
|--------|-------------|
| **Inventory Management** | Track stock levels, receive deliveries |
| **Recipe Costing** | Link ingredients to menu items, calculate food cost |
| **Real-Time Dashboards** | Sales vs labor, food cost %, covers |
| **86 Management** | Out of stock flows through all channels |
| **AI Insights v1** | "Your food cost spiked 3% this week" |

**Phase 2 Exit Criteria:**
- [ ] Can track inventory counts
- [ ] Can see food cost per dish
- [ ] Real-time sales dashboard
- [ ] AI generates weekly insights email

---

### Phase 3: Optimization (6-12 months)
*Goal: System that makes you more profitable*

| Module | Description |
|--------|-------------|
| **Employee Scheduling** | Build schedules, track labor cost |
| **Time & Attendance** | Clock in/out, break tracking |
| **Tip Management** | Pooling, distribution, compliance |
| **Menu Engineering** | Profitability analysis, pricing recommendations |
| **Demand Forecasting** | Predict covers, suggest prep levels |
| **Vendor Management** | Track prices, compare vendors |
| **QuickBooks Integration** | Sync sales, COGS, labor to accounting |

---

### Phase 4: Growth (12+ months)
*Goal: System that grows with you*

| Module | Description |
|--------|-------------|
| **Multi-Location** | Centralized management, location comparison |
| **Loyalty Program** | Points, rewards, customer retention |
| **Marketing Tools** | Email/SMS campaigns, review management |
| **Delivery Integration** | DoorDash, UberEats, Grubhub aggregation |
| **Catering Module** | Quotes, large order management |
| **Payroll Integration** | ADP, Gusto connection |

---

## AI Strategy

### Philosophy
AI should feel like a smart business partner, not a robot. It should:
- **Observe** - Notice patterns humans miss
- **Alert** - Flag problems before they're disasters  
- **Recommend** - Suggest actions, not just data
- **Learn** - Get smarter about THIS restaurant over time

### AI Features by Module

| Module | AI Capability |
|--------|---------------|
| **POS** | "Table 12 hasn't ordered drinks - suggest upsell" |
| **Inventory** | "You'll run out of chicken by Thursday" |
| **Recipe Costing** | "Salmon cost up 18% this month - adjust menu price?" |
| **Scheduling** | "Historically slow Tuesday - cut a server?" |
| **Reporting** | "Food cost spiked - here's why and what to do" |
| **Menu Engineering** | "This dish is popular but unprofitable - consider..." |
| **Demand Forecasting** | "Weather + local event = expect 40% more covers Saturday" |

### AI Technical Approach
- Use Claude/GPT for natural language insights
- Build domain-specific models for forecasting
- Embeddings for similarity (find similar past days/scenarios)
- Start with rule-based, add ML as data accumulates

---

## Competitive Positioning

### vs. Toast
| Toast | OrderStack |
|-------|-----------|
| $799+ hardware | BYOD |
| 2.49-2.99% transaction fees | Transparent flat rate |
| Complex, feature-bloated | Modular, simple |
| Cloud-dependent | Offline-first |
| Generic reporting | AI-powered insights |

**Our Pitch:** "Toast charges you for their hardware, then takes a cut of every sale. We let you use your own devices and charge a fair flat rate. No surprises."

### vs. Square for Restaurants  
| Square | OrderStack |
|--------|-----------|
| Generic (not restaurant-native) | Built specifically for restaurants |
| Limited kitchen features | Full KDS included |
| Basic inventory | Recipe-level costing |
| No real AI | AI-native |

**Our Pitch:** "Square is great for coffee shops. For a real restaurant, you need software that understands courses, modifiers, kitchen timing, and food cost. That's us."

---

## Business Model

### Pricing Philosophy
- No hardware markup
- No transaction percentage
- Simple, predictable monthly fees
- Free tier to reduce barrier

### Proposed Pricing Structure

**Starter (Free)**
- 1 POS terminal
- Basic menu management
- 100 orders/month
- Community support

**Professional ($79/month per location)**
- Unlimited terminals
- Unlimited orders
- KDS included
- Basic reporting
- Email support

**Business ($149/month per location)**
- Everything in Professional
- Online ordering
- Inventory management
- Recipe costing
- AI insights
- Priority support

**Enterprise (Custom)**
- Multi-location
- API access
- Custom integrations
- Dedicated support

### Module Add-Ons (à la carte)
- Advanced Scheduling: +$29/month
- Tip Management: +$19/month
- Marketing Suite: +$39/month
- Loyalty Program: +$29/month

### Payment Processing
Partner with Stripe for payments. Pass through Stripe's rates (2.9% + 30¢) with no markup. Restaurants can also use their own processor.

---

## Technical Architecture

### Current Stack
- **Frontend:** Angular (web app), React Native (mobile POS/KDS)
- **Backend:** Express.js, TypeScript
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Payments:** Stripe
- **Hosting:** Render.com (current), likely AWS/Vercel for production

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenant | Single DB, tenant isolation via restaurantId | Cost-effective at scale, simpler ops |
| Offline | Local SQLite + sync queue | Critical for restaurant reliability |
| Real-time | WebSockets (planned) | KDS needs instant updates |
| Mobile | React Native | Cross-platform, offline capable |
| AI | Claude API + custom models | Best reasoning, restaurant-specific |

### Data Model (Core Entities)
```
Restaurant
├── Menu Categories
│   └── Menu Items
│       └── Modifier Groups
│           └── Modifiers
├── Tables
├── Employees
├── Customers
├── Orders
│   └── Order Items
│       └── Order Item Modifiers
├── Inventory Items
│   └── Recipes (joins to Menu Items)
└── Vendors
```

---

## Go-to-Market Strategy

### Phase 1: Friends & Family Alpha
- Deploy at in-laws' restaurants
- Iterate based on real usage
- Document everything for case study

### Phase 2: Local Beta
- 5-10 restaurants in South Florida
- Focus on Peruvian/Latin fast casual (network effect)
- Free in exchange for feedback and testimonials

### Phase 3: Paid Pilot
- Convert beta users to paid
- Begin content marketing (blog, social)
- Build case studies

### Phase 4: Scale
- Paid advertising
- Partner with restaurant associations
- Consider restaurant consultants as channel

---

## Success Metrics

### Product Metrics
- Daily Active Restaurants
- Orders Processed / Day
- Offline Mode Usage (indicates reliability value)
- Feature Adoption by Module
- AI Recommendation Acceptance Rate

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate
- Net Promoter Score (NPS)

### North Star Metric
**"Restaurants Profitable on OrderStack"**
- Can we prove that restaurants using OrderStack have better margins?
- This becomes our ultimate marketing message

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| No restaurant experience | In-law pilot, extensive user research |
| Toast/Square competition | Focus on underserved segment, differentiate on AI |
| Hardware reliability (BYOD) | Extensive device testing, recommended devices list |
| Offline sync complexity | Invest heavily in sync infrastructure |
| Solo founder | Prioritize ruthlessly, consider technical co-founder |

---

## Open Questions

1. **Pricing Validation:** Will restaurants pay $79-149/month? Need to test.

2. **Hardware:** Should we offer "recommended bundles" (tablet + stand + printer + card reader)?

3. **Delivery Integration:** Build our own delivery network or integrate with existing?

4. **Language:** Spanish-first for Latin market segment? Bilingual UI?

5. **Compliance:** PCI compliance for payments, tip law compliance by state - need legal review.

---

## Next Steps (Immediate)

1. ✅ Complete POS core functionality
2. ✅ Connect KDS to live data
3. 🔲 Interview in-laws (dinner in ~2 weeks)
4. 🔲 Update KDS dependencies
5. 🔲 Implement restaurant authentication (remove hardcoded ID)
6. 🔲 Build basic reporting dashboard
7. 🔲 Create online ordering module
8. 🔲 Deploy to production environment for pilot

---

*Document Version: 1.0*
*Last Updated: January 21, 2025*
*Author: Jeff Martin + Claude*
