export type ProductVertical =
  | 'cosmetics'
  | 'supplements'
  | 'devices'
  | 'general';

export type RuleSeverity = 'critical' | 'high' | 'medium';

export interface ComplianceRule {
  id: string;
  slug: string;
  verticals: ProductVertical[];
  category:
    | 'Drug Claim'
    | 'Disease Claim'
    | 'OTC Monograph Drug'
    | 'FDA Terminology Misuse'
    | 'Prohibited / Tainted Ingredient'
    | 'EPA Pesticide Trap'
    | 'FTC Substantiation';
  severity: RuleSeverity;
  weight: number;
  titleEn: string;
  titleZh: string;
  statute: string;
  officialRefUrl: string;
  officialRefLabel: string;
  whyFlaggedEn: string;
  whyFlaggedZh: string;
  safeRewriteEn: string;
  safeRewriteZh: string;
  precedentEn: string;
  precedentZh: string;
  patterns: string[];
  seoQuestionEn: string;
  seoQuestionZh: string;
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'FDA-TERM-001',
    slug: 'fda-approved-claim-on-cosmetics-or-supplements',
    verticals: ['cosmetics', 'supplements', 'devices', 'general'],
    category: 'FDA Terminology Misuse',
    severity: 'critical',
    weight: 30,
    titleEn: 'Unauthorized "FDA Approved" / "FDA Certified" Claim',
    titleZh: '违规使用“FDA Approved / FDA Certified”宣称',
    statute: 'FD&C Act §301(l) & 21 CFR 807.39',
    officialRefUrl: 'https://www.fda.gov/consumers/consumer-updates/it-really-fda-approved',
    officialRefLabel: 'FDA.gov — Is It Really "FDA Approved"?',
    whyFlaggedEn:
      'FDA does NOT pre-approve cosmetics, dietary supplements, or most Class I/II consumer devices. Using "FDA Approved" or "FDA Certified" on Amazon or TikTok Shop is one of the fastest triggers for automated ASIN suppression and FDA misbranding citations.',
    whyFlaggedZh:
      'FDA 从不事前批准（Approve）化妆品、膳食补充剂及绝大多数 I/II 类家用仪器。在 Amazon/TikTok Shop 详情页写“FDA Approved”或“FDA Certified”是触发平台机器人秒下架和 FDA 错误标签处罚的头号雷区。',
    safeRewriteEn:
      'Remove "FDA Approved". For supplements, state "Manufactured in an FDA-registered, cGMP-compliant facility" (without implying product approval). For Class II devices with valid 510(k), state "FDA 510(k) Cleared (K-number)".',
    safeRewriteZh:
      '立即删除“FDA Approved”。保健品可改为“在符合 cGMP 标准且已完成 FDA 备案的工厂生产”（勿暗示产品获批）；确有 510(k) 的 II 类仪器必须写“FDA 510(k) Cleared”并附 K 号。',
    precedentEn:
      'Repeatedly cited in FDA consumer warnings and Amazon Restricted Products bot sweeps targeting supplements, LED masks, and skincare.',
    precedentZh:
      '在 FDA 官方警示与 Amazon 限售商品自动扫号中高频触发，尤其集中在保健品、LED 美容仪与护肤品。',
    patterns: [
      '(?<!\\bnot\\s)(?<!\\bnever\\s)(?<!\\bno\\s)(?<!\\bnon[-\\s])\\bfda[-\\s]+approved\\b',
      '(?<!\\bnot\\s)\\bapproved\\s+by\\s+(the\\s+)?fda\\b',
      '\\bfda\\s+approval\\b',
      '(?<!\\bnot\\s)\\bfda[-\\s]+certified\\b',
      '(?<!\\bnot\\s)\\bcertified\\s+by\\s+(the\\s+)?fda\\b',
    ],
    seoQuestionEn: 'Can you write "FDA Approved" on Amazon supplements, cosmetics, or LED masks?',
    seoQuestionZh: 'Amazon 保健品、美妆或美容仪详情页可以写“FDA Approved”吗？',
  },
  {
    id: 'FDA-TERM-002',
    slug: 'fda-certificate-and-registration-misrepresentation',
    verticals: ['cosmetics', 'supplements', 'devices'],
    category: 'FDA Terminology Misuse',
    severity: 'high',
    weight: 20,
    titleEn: 'Deceptive "FDA Registered Product" / "FDA Certificate" Endorsement Claim',
    titleZh: '违规宣称“FDA 注册产品 / FDA 官方证书”暗示官方背书',
    statute: '21 CFR 807.39 & MoCRA Facility Registration Policy',
    officialRefUrl: 'https://www.fda.gov/cosmetics/registration-listing-cosmetic-product-facilities-and-products',
    officialRefLabel: 'FDA.gov — MoCRA Registration & Listing',
    whyFlaggedEn:
      'Under 21 CFR 807.39, device/facility registration NEVER denotes official FDA approval of a product, and FDA explicitly states it does not issue "FDA Certificates" for cosmetic (MoCRA) or supplement facilities. Advertising a product itself as "FDA Registered" or displaying third-party "FDA Certificate" badges triggers misbranding and Amazon appeal rejections.',
    whyFlaggedZh:
      '依据 21 CFR 807.39，工厂/设施备案绝不代表产品获 FDA 批准；FDA 更明确声明不为 MoCRA 化妆品或保健品工厂颁发“FDA 证书”。宣称产品“FDA Registered”或上传第三方伪“FDA 证书”图极易触发误导标签与申诉被拒。',
    safeRewriteEn:
      'State factual facility compliance only if accurate (e.g., "Produced in a cGMP-audited facility") and remove "FDA Registered" product badges or third-party "FDA Certificate" graphics from listing images.',
    safeRewriteZh:
      '仅陈述客观制造合规事实（如“通过第三方 cGMP/ISO 体系认证”），删除将产品称为“FDA Registered”的文案以及代理机构出具的非官方“FDA 证书”配图。',
    precedentEn:
      '21 CFR 807.39 explicitly deems any representation that creates an impression of official FDA approval from registration to be misleading misbranding.',
    precedentZh:
      '21 CFR 807.39 明文规定：任何利用注册/备案制造官方背书印象的营销表述均属违法错误标签（Misbranding）。',
    patterns: [
      '\\bfda\\s+certificate\\b',
      '\\bfda\\s+seal\\b',
      '\\bfda\\s+endorsed\\b',
      '\\bofficial\\s+fda\\s+badge\\b',
      '\\bfda\\s+guaranteed\\b',
      '\\bfda[-\\s]+registered\\s+(product|device|mask|serum|cream|supplement|formula|brand)\\b',
      '\\bproduct\\s+is\\s+fda[-\\s]+registered\\b',
    ],
    seoQuestionEn: 'Does FDA issue certificates for MoCRA cosmetics or allow "FDA Registered" marketing?',
    seoQuestionZh: 'FDA 会给 MoCRA 化妆品发官方证书吗？详情页能写“FDA Registered”吗？',
  },
  {
    id: 'COS-OTC-SPF',
    slug: 'cosmetic-spf-sunscreen-uv-protection-otc-drug',
    verticals: ['cosmetics', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'critical',
    weight: 30,
    titleEn: 'OTC Sunscreen Drug Trigger (SPF / Sun Protection / Sunburn Prevention)',
    titleZh: '化妆品触发 OTC 防晒药专论（SPF / 防晒 / 抵御紫外线 / 防晒伤）',
    statute: '21 CFR Part 352 & CARES Act OTC Sunscreen Deemed Final Order (M020)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-352',
    officialRefLabel: 'eCFR — 21 CFR Part 352 Sunscreen Drug Products',
    whyFlaggedEn:
      'In the United States, ANY cosmetic making an SPF value, "sun protection", "broad-spectrum UV", or "prevents sunburn" claim is legally regulated as an OTC Drug—not just a cosmetic. Selling it without an approved OTC UV active, Drug Facts box, NDC drug listing, and broad-spectrum SPF testing triggers immediate Amazon suppression.',
    whyFlaggedZh:
      '在美国，任何美妆/护肤品一旦宣称 SPF 指数、“防晒（sun protection）”、“阻隔紫外线”或“防晒伤”，在法律上立刻升格为 OTC 非处方药物，必须具备合规 OTC 防晒活性成分、Drug Facts 药盒标签、NDC 列名与广谱 SPF 实测报告，否则 Amazon 必下架。',
    safeRewriteEn:
      'If your product is a cosmetic (not an OTC listed sunscreen with Drug Facts panel), remove ALL SPF numbers, "sun protection", "UV shield", and "prevents sunburn" claims entirely.',
    safeRewriteZh:
      '若未完成美国 OTC 防晒药 NDC 注册与 SPF 临床测试，必须彻底删除所有 SPF 数值、“sun protection”、“UV protection”与“sunburn”字样。',
    precedentEn:
      'Moisturizers, tinted drops, and Korean/Asian sunscreens imported without U.S. OTC Drug Facts panels face relentless Amazon gating and FDA Import Alerts.',
    precedentZh:
      '无美国 Drug Facts 标签的日韩/跨境防晒乳与“带防晒值素颜霜”是 Amazon 限售审查与海关扣货高危品。',
    patterns: [
      '\\bspf\\s*\\d+\\+?\\b',
      '\\b(sun\\s+protection|broad[-\\s]?spectrum\\s+uv|uv[ab]?\\s+protection|blocks?\\s+uv\\s+rays?|sunscreen\\s+protection)\\b',
      '\\b(prevents?|protects?\\s+against)\\s+sunburn\\b',
    ],
    seoQuestionEn: 'Can a U.S. skincare serum or moisturizer claim "SPF 50" or "sun protection" as a cosmetic?',
    seoQuestionZh: '美国站护肤精华或素颜霜可以不办 OTC 直接写“SPF 50 / Sun Protection”吗？',
  },
  {
    id: 'COS-OTC-DANDRUFF',
    slug: 'anti-dandruff-seborrheic-wart-remover-otc-drug',
    verticals: ['cosmetics', 'supplements', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'critical',
    weight: 28,
    titleEn: 'OTC Anti-Dandruff / Ketoconazole / Wart & Skin-Tag Removal Drug Claim',
    titleZh: '触发 OTC 药品专论（去屑洗护 / 酮康唑 / 去疣 / 去皮赘）',
    statute: '21 CFR Part 358 Subpart H (Dandruff, Seborrheic Dermatitis & Psoriasis OTC Monograph)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-358/subpart-H',
    officialRefLabel: 'eCFR — 21 CFR 358 Subpart H Dandruff/Psoriasis Drug Monograph',
    whyFlaggedEn:
      'Under 21 CFR Part 358, "anti-dandruff", "treats dandruff", "scalp psoriasis", "seborrheic dermatitis", "ketoconazole", and "wart / skin tag removal" are strictly OTC Drug claims. Marketing them as ordinary cosmetics or supplements without a Drug Facts label & NDC listing violates federal law.',
    whyFlaggedZh:
      '依据 21 CFR Part 358，宣称“去屑（anti-dandruff）”、“治疗头皮屑/脂溢性皮炎”、“酮康唑（ketoconazole）”或“去疣/去皮赘（wart / skin tag remover）”均属 OTC 药品范畴，不能按普通化妆品或补剂上架。',
    safeRewriteEn:
      'For cosmetic scalp products without OTC Drug Facts registration, replace "anti-dandruff" with "gently cleanses dry, flaky-looking scalp" and remove all wart/skin-tag removal claims.',
    safeRewriteZh:
      '无 OTC 药盒资质的洗护产品，必须将“anti-dandruff”改为“温和清洁干燥易起屑外观的头皮（cleanses dry, flaky-looking scalp）”，并彻底删除所有去疣/去皮赘词。',
    precedentEn:
      'FDA issued repeated public safety warnings against unapproved online wart/mole/skin-tag removers and un-monographed anti-dandruff scalp serums.',
    precedentZh:
      'FDA 多次发专项安全警示打击电商未获批去疣/去痣/去皮赘产品与无 OTC 资质去屑精华。',
    patterns: [
      '\\banti[-\\s]?dandruff\\b',
      '\\b(treat|treats|cure|cures|eliminate|eliminates|control|controls|stop|stops|fight|fights|remove|removes|relieve|relieves)\\s+(\\w+\\s+){0,2}(dandruff|seborrheic\\s+dermatitis|scalp\\s+psoriasis|warts?|skin\\s+tags?|moles?|nail\\s+fungus|toenail\\s+fungus|athlete[\'’]?s\\s+foot|ringworm)\\b',
      '\\b(wart|skin\\s+tag|mole)\\s+(remover|removal|treatment|eliminator)\\b',
      '\\bketoconazole\\b',
    ],
    seoQuestionEn: 'Is "anti-dandruff" or "skin tag remover" a cosmetic or an OTC drug under FDA rules?',
    seoQuestionZh: '美国站洗护写“Anti-Dandruff”或售卖去皮赘/去疣产品属于化妆品还是 OTC 药？',
  },
  {
    id: 'COS-DRUG-001',
    slug: 'cosmetic-acne-eczema-psoriasis-rosacea-claims',
    verticals: ['cosmetics', 'general'],
    category: 'Drug Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Cosmetic Skin-Disease Treatment Claim (Acne / Eczema / Psoriasis / Rosacea)',
    titleZh: '化妆品宣称治疗皮肤疾病（祛痘/湿疹/牛皮癣/玫瑰痤疮）',
    statute: 'FD&C Act §201(g)(1)(B) & 21 CFR Part 333 Subpart D (OTC Acne Monograph)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-333/subpart-D',
    officialRefLabel: 'eCFR — 21 CFR 333 Subpart D Topical Acne Drug Monograph',
    whyFlaggedEn:
      'Claiming a cosmetic treats, clears, reduces, cures, or prevents acne, eczema, psoriasis, dermatitis, or rosacea legally reclassifies it as an unapproved OTC drug unless formulated and labeled under an exact OTC Drug Monograph with a Drug Facts panel.',
    whyFlaggedZh:
      '宣称化妆品能“治疗/清除/减轻/预防”痤疮（Acne）、湿疹（Eczema）、银屑病（Psoriasis）、皮炎或玫瑰痤疮（Rosacea），会直接导致产品在法律上被重新定性为“未获批 OTC 新药”。',
    safeRewriteEn:
      'Replace disease treatment verbs with cosmetic appearance claims: e.g., "helps visibly calm blemish-prone skin", "soothes the look of dry, redness-prone skin", "leaves skin looking clearer and balanced".',
    safeRewriteZh:
      '改用纯外观修饰类化妆品表达：“帮助舒缓易长痘肌的外观不适（visibly calm blemish-prone skin）”、“改善干燥泛红肌肤的视觉状态（soothes the look of dry, redness-prone skin）”。',
    precedentEn:
      'Top trigger in FDA cosmetic Warning Letters and Amazon Beauty & Personal Care automated ASIN removals.',
    precedentZh:
      'FDA 化妆品警告信及 Amazon 美妆个护类目自动扫号的最常见违规项。',
    patterns: [
      '\\b(treat|treats|treating|cure|cures|curing|heal|heals|healing|clear|clears|clearing|eliminate|eliminates|fight|fights|prevent|prevents|stop|stops|reduce|reduces|relief|relieves|soothe|soothes)\\s+(\\w+\\s+){0,3}(acne|eczema|psoriasis|rosacea|dermatitis|shingles|cold\\s+sores|herpes|hives)\\b',
      '\\banti[-\\s]?(acne|eczema|psoriasis|rosacea|dermatitis)\\b',
      '\\b(acne|eczema|psoriasis|rosacea)\\s+(treatment|cure|remedy|medicine|therapy|killer)\\b',
    ],
    seoQuestionEn: 'Can you say "treats acne" or "reduces rosacea" on an Amazon cosmetic listing?',
    seoQuestionZh: 'Amazon 护肤品 Listing 可以写“treats acne / reduces rosacea”吗？',
  },
  {
    id: 'COS-DRUG-002',
    slug: 'cosmetic-inflammation-wound-healing-cell-regeneration',
    verticals: ['cosmetics', 'general'],
    category: 'Drug Claim',
    severity: 'critical',
    weight: 26,
    titleEn: 'Physiological Structure/Function Claim (Inflammation / Wound Healing / Sun Damage / Acne Scars)',
    titleZh: '化妆品涉及生理机能/修复晒伤/祛痘疤/细胞抗炎宣称',
    statute: 'FD&C Act §201(g)(1)(C) & 21 CFR Part 701 (Cosmetic Labeling)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-G/part-701',
    officialRefLabel: 'eCFR — 21 CFR Part 701 Cosmetic Labeling',
    whyFlaggedEn:
      'Cosmetics may only cleanse, beautify, or alter appearance. Claims about reducing biological inflammation, repairing sun damage, fading/healing acne scars, accelerating wound healing, tightening loose skin structurally, shrinking pores permanently, or regenerating cells/collagen cross into illegal drug claims.',
    whyFlaggedZh:
      '化妆品法定用途仅限于清洁、美化或改善外观。宣称“抗炎（anti-inflammatory）”、“修复光损伤（repairs sun damage）”、“祛除痘疤（fades acne scars）”、“永久收缩毛孔”、“紧致松弛皮肤组织”或“刺激胶原蛋白生成/细胞再生”均越界构成药物宣称。',
    safeRewriteEn:
      'Shift strictly to visual appearance language: "reduces the appearance of redness", "minimizes the look of enlarged pores", "softens the appearance of past blemish marks", "promotes firmer-looking, radiant skin".',
    safeRewriteZh:
      '必须加“视觉/外观”限定词：“淡化泛红外观（reduces the appearance of redness）”、“视觉修饰毛孔外观（minimizes the look of pores）”、“淡化旧痘印外观（appearance of blemish marks）”、“令肌肤显得更紧致（firmer-looking skin）”。',
    precedentEn:
      'FDA cosmetic Warning Letters routinely cite "reduces inflammation", "repairs sun damage", "stimulates collagen production", and "cellular regeneration" as unapproved drug claims.',
    precedentZh:
      'FDA 针对精华与面霜的警告信反复点名“reduces inflammation”、“repairs sun damage”、“stimulates collagen production”、“cellular regeneration”。',
    patterns: [
      '\\b(reduce|reduces|reducing|relieve|relieves|eliminate|eliminates|fight|fights|calm|calms)\\s+(\\w+\\s+){0,2}inflammation\\b',
      '\\banti[-\\s]?inflammatory\\b',
      '\\b(heal|heals|healing|repair|repairs|repairing|accelerate|accelerates|speed|speeds)\\s+(\\w+\\s+){0,2}(wounds|cuts|burns|scars|sun\\s+damage|uv\\s+damage|damaged\\s+skin|tissue|dna)\\b',
      '\\b(fade|fades|remove|removes|erase|erases|eliminate|eliminates)\\s+(acne\\s+scars|surgical\\s+scars|stretch\\s+marks)\\b',
      '\\b(stimulate|stimulates|stimulating|boost|boosts|boosting|increase|increases|rebuild|rebuilds|trigger|triggers)\\s+(\\w+\\s+){0,2}(collagen|elastin|cell\\s+turnover|cellular)\\s+(production|synthesis|regeneration|repair|growth)\\b',
      '\\bcellular\\s+(regeneration|repair|renewal)\\b',
      '\\b(tightens?\\s+loose\\s+skin|shrinks?\\s+pores?\\s+permanently|cellulite\\s+(reduction|removal|treatment|cure))\\b',
    ],
    seoQuestionEn: 'Why does Amazon flag "repairs sun damage", "fades acne scars", and "anti-inflammatory" on skincare?',
    seoQuestionZh: '为什么护肤品写“repairs sun damage”、“fades acne scars”和“anti-inflammatory”会被 Amazon 扫号？',
  },
  {
    id: 'COS-DRUG-003',
    slug: 'hair-regrowth-and-alopecia-drug-claim',
    verticals: ['cosmetics', 'supplements'],
    category: 'Drug Claim',
    severity: 'critical',
    weight: 26,
    titleEn: 'Hair Regrowth / Anti-Hair-Loss Drug Claim',
    titleZh: '洗护/生发精华违规宣称“生发/防脱/治疗脱发”',
    statute: '21 CFR 310.527 (Hair Grower and Hair Loss Prevention Drug Products)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-310/subpart-E/section-310.527',
    officialRefLabel: 'eCFR — 21 CFR 310.527 Hair Grower Rule',
    whyFlaggedEn:
      'Under 21 CFR 310.527, any topical product claiming to regrow hair, stop baldness, reactivate follicles, or treat alopecia is an unapproved new drug (only Minoxidil has OTC monograph status for hair regrowth).',
    whyFlaggedZh:
      '依据 21 CFR 310.527，任何外用产品宣称“再生头发（regrow hair）”、“阻止脱发/秃顶（stop hair loss）”或“激活毛囊”均属未获批新药（OTC 仅米诺地尔合规）。',
    safeRewriteEn:
      'Use cosmetic fullness language: "promotes the appearance of thicker, fuller-looking hair", "reduces breakage from brushing", "nourishes scalp and hair strands".',
    safeRewriteZh:
      '改为外观丰盈与护发表达：“令秀发呈现更浓密丰盈的外观（fuller-looking hair）”、“减少梳发断裂（reduces breakage）”、“滋养头皮与发丝”。',
    precedentEn:
      'Rosemary oils, biotin serums, and eyelash serums claiming hair/lash "growth" are heavily policed by both FDA Warning Letters and Amazon bots.',
    precedentZh:
      '迷迭香精油、生物素精华及睫毛液因写“hair/lash growth”是 Amazon 与 FDA 执法重灾区。',
    patterns: [
      '\\b(regrow|regrows|regrowing|grow|grows|stimulate|stimulates)\\s+(\\w+\\s+){0,2}(hair|eyelashes|lashes|brows|follicles)\\b',
      '\\b(stop|stops|prevent|prevents|reverse|reverses|cure|cures|treat|treats)\\s+(\\w+\\s+){0,2}(hair\\s+loss|balding|baldness|alopecia|thinning\\s+hair)\\b',
      '\\bhair\\s+regrowth\\b',
      '\\banti[-\\s]?hair\\s*loss\\b',
      '\\breactivates?\\s+dormant\\s+(hair\\s+)?follicles\\b',
    ],
    seoQuestionEn: 'Can rosemary hair oil or lash serum claim "hair growth" on Amazon?',
    seoQuestionZh: '迷迭香护发精油或睫毛液可以在 Amazon 写“hair growth / regrows hair”吗？',
  },
  {
    id: 'COS-DRUG-004',
    slug: 'permanent-wrinkle-removal-and-botox-alternative',
    verticals: ['cosmetics'],
    category: 'Drug Claim',
    severity: 'high',
    weight: 20,
    titleEn: 'Permanent Wrinkle Removal / "Botox-Like" Physiological Claim',
    titleZh: '“永久去皱 / 类肉毒冻龄”药物级抗衰宣称',
    statute: 'FD&C Act §201(g)(1)(C) & FDA Cosmetic vs. Drug Boundary',
    officialRefUrl: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/it-cosmetic-drug-or-both-or-it-soap',
    officialRefLabel: 'FDA.gov — Is It a Cosmetic, a Drug, or Both?',
    whyFlaggedEn:
      'Claiming a topical cream permanently eliminates wrinkles, freezes facial muscles, or works "like Botox" asserts a physiological drug effect rather than temporary cosmetic beautification.',
    whyFlaggedZh:
      '宣称面霜可“永久消除皱纹”、“麻痹/冻结表情肌”或“替代肉毒杆菌（Botox alternative）”超越了临时外观修饰范畴，属于未获批药物宣称。',
    safeRewriteEn:
      'Use appearance qualifiers: "temporarily softens the look of fine lines and wrinkles", "leaves skin looking visibly smoother and more radiant".',
    safeRewriteZh:
      '必须加“视觉/外观”限定词：“淡化细纹与皱纹的视觉外观（softens the look of fine lines）”、“令肌肤呈现平滑光泽”。',
    precedentEn:
      'Multiple FDA Warning Letters have specifically targeted peptide creams marketed as "Botox in a bottle" or claiming to "erase wrinkles permanently".',
    precedentZh:
      'FDA 多封警告信直接点名“Botox in a bottle”、“eliminates wrinkles permanently”等多肽抗衰文案。',
    patterns: [
      '\\bbotox\\s+(in\\s+a\\s+bottle|alternative|effect|like)\\b',
      '\\bfreezes?\\s+(facial\\s+)?muscles\\b',
      '\\b(permanently\\s+)?(eliminates?|erases?|removes?)\\s+(\\w+\\s+){0,2}(wrinkles|fine\\s+lines|dark\\s+spots|cellulite)\\b',
      '\\breverses?\\s+(skin\\s+)?aging\\b',
    ],
    seoQuestionEn: 'Is "Botox in a bottle" or "eliminates wrinkles" allowed on skincare labels?',
    seoQuestionZh: '护肤品标签或详情页能写“Botox alternative”或“eliminates wrinkles”吗？',
  },
  {
    id: 'COS-DRUG-005',
    slug: 'skin-bleaching-melasma-hydroquinone-drug-claim',
    verticals: ['cosmetics'],
    category: 'Drug Claim',
    severity: 'critical',
    weight: 26,
    titleEn: 'Skin Bleaching / Melasma / Illegal OTC Hydroquinone Violation',
    titleZh: '美白祛斑越界宣称（黄褐斑/漂白/OTC 氢醌违规）',
    statute: '21 U.S.C. §355h (CARES Act OTC Monograph Reform — Hydroquinone Ban) & FD&C Act §201(g)',
    officialRefUrl: 'https://www.law.cornell.edu/uscode/text/21/355h',
    officialRefLabel: '21 U.S.C. §355h — CARES Act OTC Drug Reform',
    whyFlaggedEn:
      'Under the CARES Act (21 U.S.C. §355h), OTC skin-lightening products containing hydroquinone are illegal unapproved drugs in the U.S. Additionally, claiming a cosmetic treats melasma, inhibits melanin synthesis, or bleaches skin triggers drug classification.',
    whyFlaggedZh:
      '自 CARES 法案（21 U.S.C. §355h）生效起，美国市场非处方（OTC）含氢醌（Hydroquinone）美白产品全面非法。同时宣称“治疗黄褐斑（melasma）”、“抑制黑色素合成”或“漂白皮肤”均属未获批药物。',
    safeRewriteEn:
      'Remove hydroquinone completely and revise claims to: "brightens the look of dull, uneven skin tone" and "helps visibly fade the appearance of dark spots".',
    safeRewriteZh:
      '严禁使用氢醌成分，文案改为：“提亮暗沉不均肤色的外观（brightens the look of uneven skin tone）”、“帮助视觉淡化色斑外观（visibly fade the appearance of dark spots）”。',
    precedentEn:
      'FDA issued waves of Warning Letters to online retailers selling OTC hydroquinone and mercury-tainted skin-lightening creams.',
    precedentZh:
      'FDA 曾连续向线上美妆卖家发出多轮针对 OTC 氢醌及含汞美白霜的警告信。',
    patterns: [
      '\\bhydroquinone\\b',
      '\\b(treat|treats|cure|cures|remove|removes|eliminate|eliminates|fade|fades)\\s+(\\w+\\s+){0,2}(melasma|hyperpigmentation|vitiligo)\\b',
      '\\b(bleach|bleaches|bleaching)\\s+(dark\\s+)?skin\\b',
      '\\binhibits?\\s+melanin\\s+(production|synthesis)\\b',
    ],
    seoQuestionEn: 'Can you sell hydroquinone or melasma creams on Amazon US?',
    seoQuestionZh: '可以在 Amazon 美国站销售含氢醌或宣称祛黄褐斑（melasma）的美白霜吗？',
  },
  {
    id: 'SUP-DIS-001',
    slug: 'supplement-diabetes-blood-pressure-cholesterol-disease-claims',
    verticals: ['supplements', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 30,
    titleEn: 'Cardiometabolic Disease Claim (Diabetes / Hypertension / Cholesterol / Heart Attack)',
    titleZh: '保健品宣称治疗心血管/代谢疾病（降糖/降压/降脂/心脏病）',
    statute: '21 CFR 101.93(g) (DSHEA Disease Claim Criteria)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-F/section-101.93',
    officialRefLabel: 'eCFR — 21 CFR 101.93 Structure/Function vs. Disease Claims',
    whyFlaggedEn:
      'Claiming a dietary supplement lowers blood pressure, lowers LDL cholesterol, treats diabetes, reverses insulin resistance, or prevents heart attacks/heart disease is an explicit illegal disease claim under 21 CFR 101.93(g).',
    whyFlaggedZh:
      '依据 21 CFR 101.93(g)，膳食补充剂宣称“降低血压”、“降低胆固醇”、“控制/治疗糖尿病”或“预防心脏病/心梗”属于明确违法的疾病宣称（Disease Claim）。',
    safeRewriteEn:
      'Reframe to maintaining already-normal ranges: "helps support blood sugar levels already within the normal range*" or "supports healthy cardiovascular function*" (+ mandatory DSHEA disclaimer).',
    safeRewriteZh:
      '改为维持正常范围的表述：“帮助支持已处于正常范围内的血糖水平*（already within the normal range）”或“支持健康的心血管功能*”（必须附带 DSHEA 免责声明）。',
    precedentEn:
      'Berberine, cinnamon, garlic, and omega-3 supplements are among the top categories hit with FDA Warning Letters for diabetes and blood pressure claims.',
    precedentZh:
      '小檗碱（Berberine）、肉桂、大蒜精及鱼油是因降糖/降压文案吃 FDA 警告信的最高危品类。',
    patterns: [
      '\\b(lower|lowers|lowering|reduce|reduces|reducing|control|controls|treat|treats|cure|cures|prevent|prevents|reverse|reverses)\\s+(\\w+\\s+){0,3}(blood\\s+pressure|hypertension|cholesterol|ldl|triglycerides|blood\\s+sugar|glucose|diabetes|insulin\\s+resistance|heart\\s+disease|heart\\s+attacks?|stroke)\\b',
      '\\b(diabetes|hypertension|heart\\s+disease)\\s+(cure|treatment|remedy|prevention|relief)\\b',
      '\\banti[-\\s]?(diabetic|hypertensive)\\b',
    ],
    seoQuestionEn: 'Can a berberine or supplement listing claim to "lower blood sugar" or "prevent heart attack"?',
    seoQuestionZh: '小檗碱等保健品能在 Amazon 上写“lower blood sugar / prevent heart attack”吗？',
  },
  {
    id: 'SUP-DIS-002',
    slug: 'supplement-cancer-tumor-oncology-claim',
    verticals: ['supplements', 'cosmetics', 'devices', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 35,
    titleEn: 'Zero-Tolerance Oncology / Cancer / Tumor Claim',
    titleZh: '红线级违规：涉及抗癌 / 皮肤癌 / 肿瘤防治宣称',
    statute: 'FD&C Act §201(g) & §505(a) — Unapproved New Drug (Zero Tolerance)',
    officialRefUrl: 'https://www.fda.gov/consumers/health-fraud-scams/illegally-sold-cancer-treatments',
    officialRefLabel: 'FDA.gov — Illegal Cancer Claims Enforcement',
    whyFlaggedEn:
      'FDA enforces zero tolerance against non-approved products referencing cancer, skin cancer, tumors, or chemotherapy support. Triggers immediate FDA Warning Letters, injunctions, and permanent Amazon account suspension.',
    whyFlaggedZh:
      'FDA 对非获批产品提及癌症、皮肤癌、肿瘤、抗癌保持绝对零容忍，极易引发紧急警告信、禁令以及 Amazon 店铺永久封号。',
    safeRewriteEn:
      'Delete every mention of cancer, tumor, or carcinogens. Stick strictly to general antioxidant/cellular wellness phrasing such as "provides antioxidant support*".',
    safeRewriteZh:
      '彻底删除所有癌症、肿瘤相关词汇，仅保留“提供日常抗氧化支持*（provides antioxidant support*）”等泛健康表述。',
    precedentEn:
      'Mushroom extracts, turmeric/curcumin, soursop, and sunscreens/teas frequently draw aggressive FDA & FTC joint actions for cancer claims.',
    precedentZh:
      '灵芝/药用蘑菇提取物、姜黄素及防晒/草本产品因涉及防癌抗癌宣称屡遭 FDA 与 FTC 联合重罚。',
    patterns: [
      '\\b(fight|fights|fighting|prevent|prevents|cure|cures|treat|treats|kill|kills|shrink|shrinks|stop|stops|reduce|reduces)\\s+(\\w+\\s+){0,4}(cancer|tumors?|carcinoma|leukemia|melanoma|cancer\\s+cells)\\b',
      '\\banti[-\\s]?(cancer|tumor|carcinogenic)\\b',
      '\\b(skin\\s+)?cancer\\s+(prevention|treatment|cure|fighter|remedy)\\b',
    ],
    seoQuestionEn: 'What happens if a supplement or skincare product mentions cancer or skin cancer?',
    seoQuestionZh: '保健品或防晒护肤品文案出现防癌/皮肤癌/肿瘤词会面临什么处罚？',
  },
  {
    id: 'SUP-DIS-003',
    slug: 'supplement-anxiety-depression-adhd-alzheimers-mental-health',
    verticals: ['supplements', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Neurological & Mental-Health Disease Claim (Anxiety / Depression / ADHD / Alzheimer’s / Insomnia)',
    titleZh: '神经/精神疾病宣称（焦虑症/抑郁症/ADHD/失眠症/阿尔茨海默）',
    statute: '21 CFR 101.93(g)(2)(i) — Explicit Disease Conditions',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-F/section-101.93',
    officialRefLabel: 'eCFR — 21 CFR 101.93 Disease Criteria',
    whyFlaggedEn:
      'Anxiety disorders, clinical depression, ADHD, dementia, Alzheimer’s, migraines, and insomnia are classified as diseases by FDA. Ashwagandha, magnesium, and nootropic listings mentioning them are prime suppression targets.',
    whyFlaggedZh:
      '焦虑症、抑郁症、ADHD、老年痴呆、偏头痛及失眠症在 FDA 均界定为明确疾病。南非醉茄、镁剂、益智类补剂写这些词是 Amazon 删帖高发区。',
    safeRewriteEn:
      'Use permitted everyday wellness language: "helps manage occasional everyday stress*", "supports calm mood and restful sleep*", "supports focus and cognitive clarity*".',
    safeRewriteZh:
      '改为允许的日常状态表达：“帮助舒缓偶发日常压力*（occasional everyday stress）”、“支持平静情绪与安稳睡眠*（restful sleep）”、“支持专注力与思维清晰*”。',
    precedentEn:
      'FDA explicitly cited "treats anxiety", "relieves depression", and "cures insomnia" across dozens of CBD, mushroom, and botanical Warning Letters.',
    precedentZh:
      'FDA 在数十封针对 CBD、蘑菇及植物补剂的警告信中明确将“treats anxiety / relieves depression / cures insomnia”列为违法疾病宣称。',
    patterns: [
      '\\b(treat|treats|cure|cures|relieve|relieves|reduce|reduces|fight|fights|alleviate|alleviates|prevent|prevents|eliminate|eliminates|help\\s+with|for)\\s+(\\w+\\s+){0,2}(depression|anxiety|adhd|alzheimer[\'’]?s?|dementia|parkinson[\'’]?s?|insomnia|migraines?|ptsd|bipolar|autism|schizophrenia|panic\\s+attacks?)\\b',
      '\\banti[-\\s]?(depressant|anxiety)\\b',
      '\\b(anxiety|depression|insomnia|migraine|adhd)\\s+(relief|cure|treatment|remedy)\\b',
    ],
    seoQuestionEn: 'Can magnesium or ashwagandha listings say "anxiety relief" or "cures insomnia"?',
    seoQuestionZh: '镁剂或南非醉茄可以在 Amazon 上写“anxiety relief”或“insomnia”吗？',
  },
  {
    id: 'SUP-DIS-004',
    slug: 'supplement-arthritis-joint-inflammation-pain-relief',
    verticals: ['supplements', 'cosmetics'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 26,
    titleEn: 'Arthritis / Chronic Pain / Systemic Inflammation Disease Claim',
    titleZh: '关节炎 / 慢性止痛 / 抗炎疾病宣称',
    statute: '21 CFR 101.93(g)(2)(ii) & FDA Structure/Function Guidance',
    officialRefUrl: 'https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims',
    officialRefLabel: 'FDA.gov — Structure/Function Claims Guide',
    whyFlaggedEn:
      'Arthritis, osteoarthritis, rheumatoid arthritis, gout, sciatica, neuropathy, and "pain relief" / "anti-inflammatory" claims imply disease treatment rather than healthy joint maintenance.',
    whyFlaggedZh:
      '关节炎（Arthritis）、痛风（Gout）、坐骨神经痛、神经病变以及直接写“止痛（pain relief）”、“消炎（anti-inflammatory）”均属于疾病治疗宣称。',
    safeRewriteEn:
      'Rewrite to permitted mobility language: "supports joint comfort and flexibility*", "aids normal post-exercise muscle recovery*", "supports healthy inflammatory response after occasional exertion*".',
    safeRewriteZh:
      '合规改写为：“支持关节舒适度与灵活性*（supports joint comfort and flexibility）”、“助力运动后正常肌肉恢复*（normal post-exercise recovery）”。',
    precedentEn:
      'Turmeric, glucosamine, and topical balms routinely trigger Amazon compliance flags for "arthritis pain relief".',
    precedentZh:
      '姜黄、氨糖及外用舒缓膏因出现“arthritis pain relief”极易触发 Amazon 合规冻结。',
    patterns: [
      '\\b(relieve|relieves|treat|treats|cure|cures|reduce|reduces|stop|stops|soothe|soothes|for)\\s+(\\w+\\s+){0,2}(arthritis|osteoarthritis|rheumatoid|gout|sciatica|neuropathy|fibromyalgia|tendonitis|joint\\s+pain|chronic\\s+pain|nerve\\s+pain)\\b',
      '\\b(arthritis|pain|sciatica|gout|neuropathy)\\s+(relief|cure|treatment|killer|remedy)\\b',
      '\\bpain\\s+reliever\\b',
    ],
    seoQuestionEn: 'Can turmeric or glucosamine supplements claim "joint pain relief" or "arthritis"?',
    seoQuestionZh: '姜黄或氨糖保健品能写“joint pain relief”或“arthritis”吗？',
  },
  {
    id: 'SUP-DIS-005',
    slug: 'supplement-antiviral-cold-flu-covid-infection-claim',
    verticals: ['supplements', 'cosmetics', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Infectious Disease / Antiviral / Cold, Flu & UTI Treatment Claim',
    titleZh: '抗病毒 / 防治感冒流感 / 抗感染（含尿路感染）疾病宣称',
    statute: 'FD&C Act §201(g) & 21 CFR 101.93(g)',
    officialRefUrl: 'https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims',
    officialRefLabel: 'FDA.gov — Immune vs. Disease Claims',
    whyFlaggedEn:
      'Claiming a product prevents or treats colds, flu, COVID-19, UTIs, yeast infections, parasites, or acts as an antiviral/antibiotic turns a supplement or wash into an unapproved drug.',
    whyFlaggedZh:
      '宣称产品能预防/治疗感冒、流感、新冠、尿路感染（UTI）、念珠菌/霉菌感染、杀灭病毒或充当天然抗生素，会直接构成未获批药物违规。',
    safeRewriteEn:
      'Stick strictly to healthy immune/tract support: "supports a healthy immune system*", "supports urinary tract wellness*", "maintains balanced everyday flora*".',
    safeRewriteZh:
      '收敛为正常功能维护：“支持健康的免疫系统*（supports a healthy immune system）”、“支持泌尿道日常健康*（urinary tract wellness）”。',
    precedentEn:
      'Elderberry, cranberry, oregano oil, colloidal silver, and vitamin C listings frequently face rapid suppression for cold/flu/UTI claims.',
    precedentZh:
      '接骨木莓、蔓越莓、牛至油、胶体银及维 C 补剂因写感冒/流感/UTI 词常遭瞬间下架。',
    patterns: [
      '\\b(prevent|prevents|treat|treats|cure|cures|fight|fights|kill|kills|stop|stops|relieve|relieves|protect\\s+against)\\s+(\\w+\\s+){0,2}(colds?|flu|influenza|covid|coronavirus|viruses?|viral\\s+infections?|bacterial\\s+infections?|uti|urinary\\s+tract\\s+infections?|yeast\\s+infections?|candida|parasites?|strep|pneumonia)\\b',
      '\\b(antiviral|anti[-\\s]?viral|natural\\s+antibiotic|antibiotic\\s+alternative)\\b',
      '\\b(cold\\s+and\\s+flu|uti|yeast\\s+infection)\\s+(cure|treatment|remedy|relief|prevention)\\b',
    ],
    seoQuestionEn: 'Can elderberry or cranberry supplements claim to prevent colds or UTIs on Amazon?',
    seoQuestionZh: '接骨木莓或蔓越莓补剂能在 Amazon 上写“预防感冒”或“治疗 UTI”吗？',
  },
  {
    id: 'SUP-DIS-GI',
    slug: 'supplement-hangover-liver-detox-gerd-leaky-gut-claims',
    verticals: ['supplements', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 26,
    titleEn: 'Hangover Cure / Acid Reflux (GERD) / Fatty Liver / Leaky Gut & Detox Claim',
    titleZh: '解酒护肝/胃食管反流/肠漏症/排毒清毒素高危宣称',
    statute: '21 CFR 101.93(g) — Alcohol Intoxication & Gastrointestinal Disease Claims',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-F/section-101.93',
    officialRefLabel: 'eCFR — 21 CFR 101.93 Disease Criteria',
    whyFlaggedEn:
      'FDA treats hangovers (alcohol intoxication), GERD/acid reflux, fatty liver disease, leaky gut syndrome, IBS, and toxin "detoxification/cleansing" of organs as drug/disease claims. Milk thistle and probiotic listings making these claims frequently trigger FDA Warning Letters.',
    whyFlaggedZh:
      'FDA 将解酒/宿醉（hangover）、胃酸反流（acid reflux / GERD）、脂肪肝（fatty liver）、肠漏症（leaky gut）、肠易激（IBS）以及“肝脏排毒/清除毒素（liver detox / cleanses toxins）”均视为高危疾病或未获批药物宣称。',
    safeRewriteEn:
      'Reframe to normal organ maintenance: "supports healthy liver function*", "supports occasional digestive comfort*", "helps maintain a balanced gut microbiome*" (+ mandatory DSHEA disclaimer).',
    safeRewriteZh:
      '合规改写为：“支持正常肝脏健康功能*（supports healthy liver function）”、“支持偶发消化舒适度*（occasional digestive comfort）”、“帮助维持肠道微生态平衡*”（附 DSHEA 声明）。',
    precedentEn:
      'FDA issued dedicated multi-company Warning Letter sweeps specifically targeting hangover cure supplements and liver-detox/GERD capsules.',
    precedentZh:
      'FDA 曾针对“Hangover Cure”解酒补剂与护肝排毒/抗反流胶囊发起过多轮集中警告信打击。',
    patterns: [
      '\\bhangover\\s+(cure|relief|prevention|remedy|recovery|pill|defender)\\b',
      '\\b(prevents?|cures?|treats?|relieves?)\\s+(a\\s+)?hangovers?\\b',
      '\\b(relieve|relieves|treat|treats|cure|cures|heal|heals|stop|stops|prevent|prevents|for)\\s+(\\w+\\s+){0,2}(acid\\s+reflux|gerd|heartburn|fatty\\s+liver|cirrhosis|leaky\\s+gut|ibs|ulcers?|crohn[\'’]?s|colitis)\\b',
      '\\b(liver\\s+detox|detoxes?\\s+liver|cleanses?\\s+toxins?|flushes?\\s+toxins?|heavy\\s+metal\\s+detox)\\b',
    ],
    seoQuestionEn: 'Can milk thistle or probiotics claim "hangover cure", "liver detox", or "acid reflux relief"?',
    seoQuestionZh: '奶蓟草或益生菌能在 Amazon 写“hangover cure / liver detox / acid reflux”吗？',
  },
  {
    id: 'SUP-DIS-HORMONE',
    slug: 'supplement-testosterone-male-enhancement-pms-menopause-claims',
    verticals: ['supplements'],
    category: 'Disease Claim',
    severity: 'high',
    weight: 24,
    titleEn: 'Hormonal / Testosterone Booster / Male Enhancement / PMS & Menopause Trigger',
    titleZh: '激素类/促睾/男性增强/经前综合征与更年期高危扫号宣称',
    statute: '21 CFR 101.93(g) & Amazon Restricted Sexual Wellness / Supplement Policy',
    officialRefUrl: 'https://www.fda.gov/consumers/health-fraud-scams/health-fraud-product-database',
    officialRefLabel: 'FDA.gov — Health Fraud & Sexual Enhancement Enforcement',
    whyFlaggedEn:
      'Amazon heavily restricts "Male Enhancement" and aggressive "Boosts Testosterone" / erectile dysfunction claims due to rampant hidden drug adulteration. Likewise, claiming to treat PMS, PCOS, or menopause hot flashes triggers 21 CFR 101.93(g) disease enforcement.',
    whyFlaggedZh:
      '因非法添加西药泛滥，“Male Enhancement（男性增强）”、“Boosts Testosterone（促睾）”及勃起功能宣称是 Amazon 重点高危冻结词；宣称治疗 PMS、PCOS 或更年期潮热（menopause hot flashes）亦属疾病宣称。',
    safeRewriteEn:
      'Use permitted vitality framing: "supports male vitality, stamina, and healthy energy levels*" or "supports everyday comfort during normal menstrual/midlife transitions*" (+ DSHEA disclaimer).',
    safeRewriteZh:
      '改为允许的日常活力表述：“支持男性日常活力与耐力*（supports male vitality and stamina）”或“支持女性正常生理周期日常舒适度*”（附 DSHEA 免责声明）。',
    precedentEn:
      'Sexual enhancement and testosterone boosters are the #1 targeted segment in FDA Health Fraud notifications and Amazon mandatory ISO-17025 COA gating.',
    precedentZh:
      '男性增强与促睾类目高居 FDA 健康欺诈通报榜首，也是 Amazon 强制抽检 ISO-17025 COA 的头号对象。',
    patterns: [
      '\\b(boosts?|increases?|raises?|maximizes?)\\s+(free\\s+|natural\\s+)?testosterone\\b',
      '\\b(male\\s+enhancement|erectile\\s+dysfunction|ed\\s+treatment|cures?\\s+impotence)\\b',
      '\\b(relieve|relieves|treat|treats|cure|cures|eliminate|eliminates|stops?)\\s+(\\w+\\s+){0,3}(pms|pcos|menopause|hot\\s+flashes|infertility|endometriosis)\\b',
    ],
    seoQuestionEn: 'Why do "Boosts Testosterone", "Male Enhancement", and "Menopause Hot Flashes" get flagged on Amazon?',
    seoQuestionZh: '为什么“Boosts Testosterone / Male Enhancement / Menopause”容易触发 Amazon 下架？',
  },
  {
    id: 'SUP-DIS-006',
    slug: 'weight-loss-obesity-glp1-ozempic-claim',
    verticals: ['supplements', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Illegal Weight-Loss / Obesity / "Nature’s Ozempic" GLP-1 Drug Comparison',
    titleZh: '违规减肥 / 治疗肥胖 / 碰瓷“天然司美格鲁肽（Ozempic / GLP-1）”宣称',
    statute: '21 CFR 101.93(g) & FDA Weight Loss Health Fraud Policy',
    officialRefUrl: 'https://www.fda.gov/drugs/medication-health-fraud-notifications/weight-loss-product-notifications',
    officialRefLabel: 'FDA.gov — Weight Loss Product Notifications',
    whyFlaggedEn:
      'Comparing supplements to prescription GLP-1 drugs (Ozempic, Wegovy, Mounjaro), claiming to "treat obesity", or promising effortless rapid fat loss without diet/exercise triggers both FDA unapproved-drug alerts and FTC fraud enforcement.',
    whyFlaggedZh:
      '将保健品对标处方 GLP-1 药物（如 Nature’s Ozempic / Wegovy 替代）、宣称治疗肥胖症或承诺“躺瘦/无需节食快速燃脂”，会同时触发 FDA 未获批新药与 FTC 虚假宣传重罚。',
    safeRewriteEn:
      'State realistic metabolic support only: "supports healthy metabolism when paired with balanced diet and regular exercise*" or "helps support feelings of fullness*".',
    safeRewriteZh:
      '仅保留客观代谢支持表述：“配合均衡饮食与规律运动，支持健康新陈代谢*（supports healthy metabolism alongside diet & exercise）”。',
    precedentEn:
      '2024–2026 FDA/FTC crackdown specifically targets berberine, apple cider vinegar, and herbal gummies marketed as "GLP-1 alternatives" or "Ozempic dupes".',
    precedentZh:
      '2024–2026 年 FDA 与 FTC 重点打击自称“GLP-1 替代品 / 天然 Ozempic”的小檗碱与苹果醋软糖。',
    patterns: [
      '\\b(nature[\'’]?s\\s+ozempic|ozempic\\s+(alternative|dupe|replacement)|wegovy\\s+alternative|mounjaro\\s+alternative|glp[-\\s]?1\\s+(alternative|replacement|dupe))\\b',
      '\\b(treat|treats|cure|cures|reverse|reverses)\\s+obesity\\b',
      '\\b(effortless|rapid|instant|guaranteed)\\s+(weight\\s+loss|fat\\s+loss|fat\\s+burning)\\b',
      '\\bmelts?\\s+(away\\s+)?(belly\\s+)?fat\\b',
      '\\blose\\s+\\d+\\s*(lbs?|pounds?|kg)\\s+in\\s+\\d+\\s*(days?|weeks?)\\b',
    ],
    seoQuestionEn: 'Can a supplement be marketed as "Nature’s Ozempic" or a GLP-1 alternative?',
    seoQuestionZh: '保健品可以营销为“天然 Ozempic”或 GLP-1 替代品吗？',
  },
  {
    id: 'ING-TAINT-001',
    slug: 'fda-tainted-supplement-hidden-drug-ingredients',
    verticals: ['supplements', 'cosmetics', 'general'],
    category: 'Prohibited / Tainted Ingredient',
    severity: 'critical',
    weight: 35,
    titleEn: 'FDA Tainted Product / High-Risk Adulterant or Restricted Active Ingredient',
    titleZh: '高危成分预警：FDA 重点缉查的非法添加西药/高风险禁售成分',
    statute: 'FD&C Act §505(a) & FDA Health Fraud Product Database',
    officialRefUrl: 'https://www.fda.gov/consumers/health-fraud-scams/health-fraud-product-database',
    officialRefLabel: 'FDA.gov — Health Fraud & Tainted Products Database',
    whyFlaggedEn:
      'Detects hidden pharmaceutical adulterants and FDA-flagged stimulants/compounds (Sildenafil, Tadalafil, Sibutramine, Yohimbine, DMAA, DMHA, Tianeptine, Phenolphthalein, Diclofenac, Dexamethasone, Ephedra, Kratom, Bimatoprost)—including 1-character typo variants—responsible for Class I FDA recalls and Amazon category bans.',
    whyFlaggedZh:
      '检出西地那非、他达拉非、西布曲明、育亨宾（Yohimbine）、DMAA/DMHA、噻奈普汀、酚酞、双氯芬酸、地塞米松、麻黄、卡痛叶等 FDA 一级召回高发成分（内置 1 字符拼写容错防漏报），极易招致海关扣货与司法追责。',
    safeRewriteEn:
      'Immediately remove the flagged ingredient from formulation and obtain a third-party ISO-17025 Certificate of Analysis (COA) screening for hidden pharmaceutical APIs before shipping to FBA.',
    safeRewriteZh:
      '立即从配方中剔除该成分，并在发货至美国 FBA 前要求代工厂出具 ISO-17025 第三方全项无非法添加西药检测报告（COA）。',
    precedentEn:
      'Accounts for the majority of Class I dietary supplement recalls in the live openFDA Enforcement dataset (including active yohimbine & sildenafil recalls).',
    precedentZh:
      '占 openFDA 实时执法库中膳食补充剂 Class I（最高级别）召回的绝对主力（含育亨宾与西地那非实时召回案例）。',
    patterns: [
      '\\b(sildenafil|tadalafil|vardenafil|sibutramine|phenolphthalein|diclofenac|dexamethasone|fluoxetine|desmethyl\\s+carbodenafil|tianeptine|dmaa|1,3-dimethylamylamine|dmha|octodrine|ephedra|ephedrine|kratom|mitragyna\\s+speciosa|bimatoprost|isopropyl\\s+cloprostenate|yohimbine|yohimbe)\\b',
    ],
    seoQuestionEn: 'Which hidden or banned ingredients (like Yohimbine or Sibutramine) trigger FDA Class I recalls?',
    seoQuestionZh: '哪些成分（如育亨宾、西布曲明、西地那非）会直接触发 FDA 一级召回或 Amazon 禁售？',
  },
  {
    id: 'ING-COS-002',
    slug: 'fda-prohibited-restricted-cosmetic-ingredients',
    verticals: ['cosmetics'],
    category: 'Prohibited / Tainted Ingredient',
    severity: 'critical',
    weight: 30,
    titleEn: 'FDA Prohibited / Restricted Cosmetic Ingredient (21 CFR 700)',
    titleZh: 'FDA 化妆品禁用/限用高危成分（21 CFR 700）',
    statute: '21 CFR Part 700 Subpart B (Prohibited & Restricted Cosmetic Ingredients)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-G/part-700',
    officialRefLabel: 'eCFR — 21 CFR Part 700 Cosmetic Ingredient Prohibitions',
    whyFlaggedEn:
      'Detects ingredients explicitly prohibited or tightly restricted in U.S. cosmetics (mercury compounds, bithionol, chloroform, methylene chloride, vinyl chloride, halogenated salicylanilides, hexachlorophene).',
    whyFlaggedZh:
      '检出美国 21 CFR 700 明令禁止或严控的化妆品原料（汞化合物、硫双二氯酚、氯仿、二氯甲烷、氯乙烯、六氯酚等），直接构成掺假（Adulterated）产品，海关可直接扣留。',
    safeRewriteEn:
      'Reformulate without prohibited substances and verify all pigments are on FDA’s approved Color Additives list for the intended application area (especially eye-area and lip-area restrictions).',
    safeRewriteZh:
      '立即更换合规替代原料，并逐一核对色素是否在 FDA 批准的色素清单（尤其注意眼部与唇部色素的严格分区限制）。',
    precedentEn:
      'FDA actively detains imported whitening creams containing mercury and eye cosmetics using unapproved colorants via Import Alerts.',
    precedentZh:
      'FDA 长期通过 Import Alert 在海关自动扣留含汞美白霜及使用未获批色素的眼妆产品。',
    patterns: [
      '\\b(mercury|mercurous\\s+chloride|calomel|ammoniated\\s+mercury|bithionol|chloroform|methylene\\s+chloride|vinyl\\s+chloride|hexachlorophene|halogenated\\s+salicylanilides|chlorofluorocarbon)\\b',
    ],
    seoQuestionEn: 'What cosmetic ingredients are prohibited by FDA under 21 CFR 700?',
    seoQuestionZh: '美国 FDA 21 CFR 700 明确禁止化妆品使用哪些成分？',
  },
  {
    id: 'EPA-PEST-001',
    slug: 'amazon-epa-fifra-antimicrobial-pesticide-bot-trap',
    verticals: ['cosmetics', 'devices', 'general'],
    category: 'EPA Pesticide Trap',
    severity: 'critical',
    weight: 26,
    titleEn: 'Amazon / EPA FIFRA Pesticide Bot Trap (Antibacterial / Antimicrobial / Mold-Free)',
    titleZh: 'Amazon 极速杀手：EPA FIFRA 农药/抗菌词扫号陷阱',
    statute: 'FIFRA (7 U.S.C. §136) & Amazon Restricted Products — Pesticides Policy',
    officialRefUrl: 'https://www.epa.gov/pesticide-registration/pesticide-registration-manual',
    officialRefLabel: 'EPA.gov — FIFRA Pesticide Registration Manual',
    whyFlaggedEn:
      'One of the #1 causes of sudden Amazon ASIN takedowns: using "antibacterial", "antimicrobial", "kills 99.9% of bacteria", "antifungal", "disinfects", "sanitizes", or "mold-resistant" on cosmetics, brushes, humidifiers, or everyday goods triggers Amazon’s automated EPA pesticide gate (requiring an EPA Registration Number).',
    whyFlaggedZh:
      'Amazon 最惨烈的自动化误杀陷阱之一：在护肤品、化妆刷、美容仪、加湿器或日用品里写“antibacterial / antimicrobial / kills bacteria / antifungal / mold-resistant”，会瞬间触发 Amazon 农药合规网关，要求提交 EPA 农药注册号，否则直接下架。',
    safeRewriteEn:
      'Remove all germ-killing / pest-repelling claims. Use "keeps product fresh", "deep-cleansing formula", "hygienic silicone surface", or "easy-to-clean material".',
    safeRewriteZh:
      '彻底删掉所有杀菌/抗菌/防霉/驱虫词。改为“深层洁净配方（deep-cleansing）”、“易清洁卫生硅胶材质（easy-to-clean surface）”等物理清洁表述。',
    precedentEn:
      'Even sellers with zero pesticide intent lose active Amazon listings overnight due to backend keywords containing "antibacterial" or "anti-fungal".',
    precedentZh:
      '大量跨境卖家仅因后台 Search Terms 填了“antibacterial”或“anti-fungal”，一夜之间主力 ASIN 全线变狗。',
    patterns: [
      '\\b(antibacterial|anti[-\\s]?bacterial|antimicrobial|anti[-\\s]?microbial|antifungal|anti[-\\s]?fungal|bactericidal|fungicidal|virucidal)\\b',
      '\\b(kills?|eliminates?|destroys?)\\s+(99\\.?9%?\\s+)?(of\\s+)?(germs|bacteria|fungi|fungus|microbes|mold|mildew|viruses)\\b',
      '\\b(disinfects?|sanitizes?|sterilizes?)\\s+(skin|hands|surfaces|brushes|tools|air|water)\\b',
      '\\b(mold|mildew|pest|bug|mosquito|insect)[-\\s]?(resistant|proof|repellent|repelling)\\b',
    ],
    seoQuestionEn: 'Why did Amazon flag my skincare or beauty tool as an unregistered EPA pesticide?',
    seoQuestionZh: '为什么我的护肤品或美妆工具会被 Amazon 误判为“未注册农药”下架？',
  },
  {
    id: 'DEV-510K-001',
    slug: 'beauty-device-medical-grade-510k-therapeutic-claim',
    verticals: ['devices', 'cosmetics'],
    category: 'Drug Claim',
    severity: 'high',
    weight: 26,
    titleEn: 'Uncleared Medical / Beauty Device Claim (510(k) Required: LED / IPL / EMS / Pain / Neuropathy)',
    titleZh: '家用美容仪/穿戴设备越界医疗宣称（需 510(k) 许可）',
    statute: 'FD&C Act §510(k) & 21 CFR Part 807 Subpart E (Premarket Notification)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-807/subpart-E',
    officialRefLabel: 'eCFR — 21 CFR 807 Subpart E (510(k) Premarket Notification)',
    whyFlaggedEn:
      'Marketing home LED masks, EMS/microcurrent muscle stimulators, IPL permanent hair removal devices, or wearables as "medical grade", or claiming they treat chronic pain, neuropathy, arthritis, sleep apnea, or diagnose arrhythmias requires active FDA 510(k) clearance under the exact CDRH product code.',
    whyFlaggedZh:
      '将家用红光面罩、EMS 微电流肌肉刺激仪、IPL 永久脱毛仪或穿戴设备标榜为“医疗级（medical grade）”，或宣称治疗慢性疼痛、神经病变（neuropathy）、关节炎、呼吸暂停或诊断心律失常，必须持有对应 Product Code 的有效 FDA 510(k) 许可。',
    safeRewriteEn:
      'If you do NOT hold an active 510(k) clearance (K-number) for this exact SKU, remove "medical grade", "IPL permanent hair removal", "EMS muscle stimulator", and all pain/neuropathy/diagnostic claims; limit strictly to non-medical general wellness or cosmetic appearance routines.',
    safeRewriteZh:
      '若该型号未取得对应 510(k) 许可号（K-Number），必须删除“medical grade”、“IPL permanent hair removal”、“EMS muscle stimulator”及一切止痛/神经修复/诊断词，仅保留非医疗居家美容外观护理描述。',
    precedentEn:
      'FDA CDRH regularly sends Warning Letters and places Import Alerts on un-cleared LED therapy, EMS, IPL, and laser beauty devices sold via e-commerce.',
    precedentZh:
      'FDA 器械中心（CDRH）频繁对无 510(k) 却打医疗功效牌的跨境 LED 美容仪、微电流仪与激光/IPL 脱毛仪发警告信及海关扣留。',
    patterns: [
      '\\b(medical[-\\s]?grade|hospital[-\\s]?grade|clinical[-\\s]?grade)\\b',
      '\\b(diagnoses?|detects?|monitors?)\\s+(\\w+\\s+){0,2}(arrhythmia|afib|atrial\\s+fibrillation|sleep\\s+apnea|hypertension|disease|diabetes)\\b',
      '\\b(cures?|treats?|heals?|relieves?|reduces?)\\s+(\\w+\\s+){0,2}(sleep\\s+apnea|snoring|chronic\\s+pain|nerve\\s+damage|neuropathy|arthritis|joint\\s+pain|muscle\\s+atrophy|varicose\\s+veins)\\b',
      '\\b(therapeutic\\s+laser|ipl\\s+permanent\\s+hair\\s+removal|permanent\\s+hair\\s+removal|ems\\s+muscle\\s+stimulator|tens\\s+pain\\s+relief)\\b',
    ],
    seoQuestionEn: 'Can a home LED mask, IPL, or EMS device say "medical grade" or "relieves neuropathy" without 510(k)?',
    seoQuestionZh: '没有 510(k) 的家用红光仪、IPL 脱毛仪或 EMS 仪能写“medical grade / 止痛”吗？',
  },
  {
    id: 'FTC-SUB-001',
    slug: 'ftc-clinically-proven-guaranteed-cure-superlatives',
    verticals: ['cosmetics', 'supplements', 'devices', 'general'],
    category: 'FTC Substantiation',
    severity: 'high',
    weight: 18,
    titleEn: 'Unsubstantiated Clinical Proof / Guaranteed Cure Claim (15 U.S.C. §52 / FTC Act)',
    titleZh: '高风险绝对化/临床背书宣称（FTC 15 U.S.C. §52 证据红线）',
    statute: 'FTC Act §§5 & 12 (15 U.S.C. §§45, 52) & 16 CFR Part 255',
    officialRefUrl: 'https://www.law.cornell.edu/uscode/text/15/52',
    officialRefLabel: '15 U.S.C. §52 — Dissemination of False Advertisements (FTC Act §12)',
    whyFlaggedEn:
      'Under FTC Act §§5 & 12 (15 U.S.C. §§45, 52), phrases like "clinically proven", "scientifically proven", "100% guaranteed cure", or "doctor-recommended treatment" require competent and reliable scientific evidence (typically randomized, controlled human clinical trials on the finished product).',
    whyFlaggedZh:
      '依据 FTC 法案第 5 与 12 条（15 U.S.C. §§45, 52），使用“clinically proven（临床证实）”、“100% guaranteed cure”等表述，必须拥有针对**该成品本身**的人体随机对照临床试验（RCT）报告，仅靠原料论文无法过关。',
    safeRewriteEn:
      'Replace absolute proof claims with honest formulation facts: "formulated with clinically studied ingredients" (only if true at the studied dose) or "backed by published ingredient research".',
    safeRewriteZh:
      '改用合规的原料级表述：“采用经临床研究的原料配制（formulated with clinically studied ingredients，需确保添加量匹配研究剂量）”，严禁写“100% 保证治愈”。',
    precedentEn:
      'FTC issued Notice of Penalty Offenses letters to ~670 supplement & skincare marketers threatening civil penalties exceeding $50,000 per violation for unsubstantiated clinical claims.',
    precedentZh:
      'FTC 曾向约 670 家保健品与美妆品牌发出处罚告知函，对缺乏成品 RCT 证据的“临床证实”宣称威胁处以单次超 5 万美元罚款。',
    patterns: [
      '\\b(clinically|scientifically|medically|doctor)\\s+(proven|tested\\s+to\\s+cure|guaranteed)\\b',
      '\\b(100%|fully)\\s+guaranteed\\s+(results|cure|relief|effective)\\b',
      '\\b(miracle|instant|permanent)\\s+(cure|remedy|healer|fix)\\b',
    ],
    seoQuestionEn: 'When can you legally say "clinically proven" on an Amazon supplement or skincare product?',
    seoQuestionZh: '保健品或护肤品在什么条件下才可以合法写“clinically proven”？',
  },
];

export const SAMPLE_LISTINGS: Record<
  string,
  {
    id: string;
    labelEn: string;
    labelZh: string;
    vertical: ProductVertical;
    title: string;
    bullets: string;
    ingredients: string;
  }
> = {
  cosmetic: {
    id: 'cosmetic',
    labelEn: 'Skincare Serum (Illustrative Risk Example)',
    labelZh: '护肤精华（高危演示样本）',
    vertical: 'cosmetics',
    title:
      'FDA Approved Retinol & Tea Tree Anti-Acne Serum – Treats Acne, Reduces Inflammation & Stimulates Collagen Production',
    bullets:
      '• Clinically proven to clear stubborn cystic acne and heal eczema redness fast.\n• Botox alternative formula permanently eliminates deep wrinkles and repairs sun damage at the cellular level.\n• Antibacterial tea tree complex kills 99.9% of bacteria on skin.\n• Manufactured in a facility with official FDA Certificate.',
    ingredients:
      'Water, Glycerin, Retinol, Niacinamide, Hydroquinone 2%, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Fragrance.',
  },
  supplement: {
    id: 'supplement',
    labelEn: 'Berberine + Ashwagandha (Illustrative Risk Example)',
    labelZh: '小檗碱 + 奶蓟草（高危演示样本）',
    vertical: 'supplements',
    title:
      'Nature’s Ozempic Berberine Complex 1200mg – Lowers Blood Sugar, Liver Detox & Hangover Cure',
    bullets:
      '• Supports healthy metabolism and helps lower blood pressure and LDL cholesterol naturally.\n• Fast-acting anxiety relief and cures insomnia without prescription drugs.\n• Relieves acid reflux, GERD, and arthritis joint pain.\n• FDA Approved facility; 100% guaranteed results in 14 days.',
    ingredients:
      'Berberine HCl 1200mg, Ashwagandha Root Extract 300mg, Milk Thistle, Yohimbine HCl, DMHA.',
  },
  device: {
    id: 'device',
    labelEn: 'Red Light LED Mask (Illustrative Risk Example)',
    labelZh: '红光 LED 美容面罩（高危演示样本）',
    vertical: 'devices',
    title:
      'FDA Approved Medical-Grade Red Light Therapy LED Face Mask – Cures Acne, Regrows Hair & Relieves Neuropathy',
    bullets:
      '• Hospital-grade therapeutic laser wavelengths stimulate collagen synthesis and accelerate wound healing.\n• Antibacterial blue light kills 99.9% of acne-causing bacteria.\n• Product is FDA-registered; clinically proven permanent wrinkle removal at home.',
    ingredients: 'Medical-grade silicone shell, 630nm/850nm LED array, USB-C controller.',
  },
};
