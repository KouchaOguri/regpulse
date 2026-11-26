export type ProductVertical =
  | 'cosmetics'
  | 'supplements'
  | 'devices'
  | 'pets'
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
    | 'FTC Substantiation'
    | 'Cosmetic Labeling & Colorants'
    | 'Animal / Pet Drug Claim'
    | 'Medical Device / Biologics';
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
      '\\b(nail\\s+fungus|toenail\\s+fungus|wart|skin\\s+tag|mole)\\s*(remover|removal|treatment|eliminator|cure|relief)?\\b',
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
      'Delete every mention of cancer, skin cancer, tumors, or carcinogens completely. Keep copy strictly limited to general cosmetic appearance or lawful wellness maintenance.',
    safeRewriteZh:
      '彻底删除所有癌症、皮肤癌、肿瘤相关词汇，仅保留合法的日常外观修饰或普通健康养护表述。',
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
      '\\bgerd\\b',
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
  {
    id: 'COS-OTC-NUMB',
    slug: 'lidocaine-benzocaine-numbing-cream-otc-drug',
    verticals: ['cosmetics', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'critical',
    weight: 30,
    titleEn: 'OTC External Analgesic / Numbing Cream Violation (Lidocaine / Benzocaine / Tetracaine)',
    titleZh: '外用麻膏/局部止痛膏 OTC 药品违规（利多卡因/苯佐卡因/丁卡因）',
    statute: '21 CFR Part 348 (External Analgesic OTC Monograph) & FDA Topical Anesthetic Enforcement',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-348',
    officialRefLabel: 'eCFR — 21 CFR Part 348 External Analgesic OTC Drug Products',
    whyFlaggedEn:
      'Topical numbing creams containing lidocaine (>4% or unapproved combinations with prilocaine/tetracaine/epinephrine) or marketed for tattooing, laser hair removal, waxing, or microneedling violate 21 CFR Part 348 and are a major 2024–2026 FDA Warning Letter target.',
    whyFlaggedZh:
      '含利多卡因（超 4% 或复配丙胺卡因/丁卡因）或宣称用于纹身、激光脱毛、微针麻木的外用麻膏违反 21 CFR Part 348，是 2024–2026 年 FDA 警告信集中重罚品类。',
    safeRewriteEn:
      'Never sell unapproved tattoo/microneedling numbing creams or >4% lidocaine OTC. If selling a compliant <=4% OTC external analgesic, follow exact 21 CFR 348 Drug Facts labeling and NDC listing; for cosmetics, remove all numbing/anesthetic claims.',
    safeRewriteZh:
      '严禁销售未获批纹身/微针麻膏或超 4% 利多卡因产品；若按化妆品上架，必须彻底删除所有麻醉、麻木（numbing/anesthetic）及成分。',
    precedentEn:
      'FDA issued high-profile Warning Letters to multiple e-commerce brands selling over-strength lidocaine numbing creams for cosmetic procedures.',
    precedentZh:
      'FDA 已向多家线上销售高浓度利多卡因美容麻膏的跨境与本土品牌发出正式警告信。',
    patterns: [
      '\\b(lidocaine|benzocaine|prilocaine|tetracaine|dibucaine)\\b',
      '\\b(numbing\\s+(cream|gel|spray|ointment|balm)|topical\\s+anesthetic|skin\\s+numbing|pain[-\\s]?free\\s+(tattoo|waxing|microneedling))\\b',
    ],
    seoQuestionEn: 'Can you sell lidocaine numbing creams for tattoos, waxing, or microneedling on Amazon?',
    seoQuestionZh: '可以在 Amazon 美国站销售含利多卡因的纹身/微针麻膏吗？',
  },
  {
    id: 'COS-OTC-EYE',
    slug: 'unapproved-ophthalmic-eye-drops-otc-drug',
    verticals: ['cosmetics', 'supplements', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'critical',
    weight: 30,
    titleEn: 'Unapproved Ophthalmic / Eye-Drop Drug Claim (Dry Eye / Pink Eye / Cataracts / Redness)',
    titleZh: '滴眼液/眼部护理未获批眼科药品高危违规（干眼/结膜炎/白内障）',
    statute: '21 CFR Part 349 (Ophthalmic OTC Monograph) & FDA Unapproved Eye Drops Enforcement',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-349',
    officialRefLabel: 'eCFR — 21 CFR Part 349 Ophthalmic Drug Products for OTC Human Use',
    whyFlaggedEn:
      'Eye drops claiming to relieve dry eye, pink eye (conjunctivitis), styes, eye redness, cataracts, or glaucoma—or containing unapproved ophthalmic actives like MSM, silver sulfate, or homeopathic belladonna—trigger aggressive FDA Warning Letters and Class I sterility recalls.',
    whyFlaggedZh:
      '滴眼液宣称缓解干眼、红眼病/结膜炎、麦粒肿、白内障，或含有 MSM、银离子等未获批眼科成分，极易触发 FDA 警告信与无菌安全召回。',
    safeRewriteEn:
      'Only market eye drops formulated strictly under 21 CFR Part 349 in cGMP sterile facilities with valid NDC registration. Never market cosmetic serums or unapproved homeopathic drops for instillation into the eye.',
    safeRewriteZh:
      '仅限严格符合 21 CFR Part 349 且在无菌 cGMP 工厂生产并完成 NDC 列名的滴眼液销售；严禁将普通护理液或顺势疗法滴剂宣称为滴眼治疗品。',
    precedentEn:
      'FDA issued major public safety alerts and Warning Letters targeting dozens of unapproved online eye drops due to infection and vision-loss risks.',
    precedentZh:
      'FDA 曾连续发布重磅安全通告与警告信，下架数十款电商渠道未获批滴眼液。',
    patterns: [
      '\\b(eye\\s+drops?|ophthalmic\\s+(solution|drops?))\\b',
      '\\b(treats?|cures?|relieves?|clears?|soothes?)\\s+(\\w+\\s+){0,2}(pink\\s+eye|conjunctivitis|dry\\s+eyes?|eye\\s+infections?|styes?|cataracts?|glaucoma|red\\s+eyes?)\\b',
    ],
    seoQuestionEn: 'Why is FDA issuing Warning Letters and recalls against OTC and homeopathic eye drops?',
    seoQuestionZh: '为什么电商滴眼液与顺势疗法眼药水频繁遭遇 FDA 警告信和召回？',
  },
  {
    id: 'COS-OTC-ORAL',
    slug: 'oral-care-gingivitis-cavity-plaque-otc-drug',
    verticals: ['cosmetics', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'high',
    weight: 24,
    titleEn: 'OTC Oral Care / Anticaries Drug Claim (Prevents Cavities / Gingivitis / Gum Disease / Remineralizes)',
    titleZh: '口腔护理触发 OTC 药品宣称（防蛀/治牙龈炎/牙周病/牙釉质再矿化）',
    statute: '21 CFR Part 355 (Anticaries OTC Monograph) & FD&C Act §201(g)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-355',
    officialRefLabel: 'eCFR — 21 CFR Part 355 Anticaries Drug Products for OTC Human Use',
    whyFlaggedEn:
      'Toothpastes, mouthwashes, nano-hydroxyapatite pastes, or whitening strips claiming to prevent cavities, treat gingivitis/periodontitis, heal bleeding gums, or biologically remineralize enamel without an approved OTC fluoride active and Drug Facts panel are unapproved drugs.',
    whyFlaggedZh:
      '牙膏、漱口水、羟基磷灰石牙膏或美白牙贴若未按 OTC 含氟药专论注册却宣称“防蛀（prevents cavities）”、“治疗牙龈炎/出血”或“牙釉质再矿化”，将直接构成未获批药品。',
    safeRewriteEn:
      'For cosmetic oral-care listings without OTC Drug Facts registration, limit claims to: "freshens breath", "brightens surface stains for a whiter-looking smile", and "leaves teeth feeling clean and smooth".',
    safeRewriteZh:
      '非 OTC 注册口腔产品仅限使用纯外观清洁表达：“清新口气（freshens breath）”、“淡化牙齿表面色渍（brightens surface stains）”。',
    precedentEn:
      'Nano-hydroxyapatite toothpastes and herbal mouthwashes routinely face Amazon suppression when claiming cavity prevention or gingivitis reversal.',
    precedentZh:
      '无氟羟基磷灰石牙膏与草本漱口水因写“防蛀/治牙龈炎”在 Amazon 极易被扫号下架。',
    patterns: [
      '\\b(prevents?|stops?|reverses?|heals?|treats?|cures?|fights?)\\s+(\\w+\\s+){0,2}(cavities|tooth\\s+decay|gingivitis|periodontitis|gum\\s+disease|bleeding\\s+gums|receding\\s+gums|canker\\s+sores)\\b',
      '\\b(remineralizes?|rebuilds?|repairs?)\\s+(tooth\\s+)?enamel\\b',
      '\\banti[-\\s]?(cavity|gingivitis|plaque)\\b',
    ],
    seoQuestionEn: 'Can fluoride-free or nano-hydroxyapatite toothpaste claim to prevent cavities or remineralize enamel?',
    seoQuestionZh: '无氟或羟基磷灰石牙膏可以在美国站宣称“防蛀”或“修复牙釉质”吗？',
  },
  {
    id: 'COS-OTC-ANTIPERSP',
    slug: 'deodorant-antiperspirant-stops-sweat-otc-drug',
    verticals: ['cosmetics'],
    category: 'OTC Monograph Drug',
    severity: 'high',
    weight: 22,
    titleEn: 'OTC Antiperspirant / Sweat-Blocking Drug Claim on Cosmetic Deodorants',
    titleZh: '普通除臭剂越界宣称“止汗/阻断汗腺/治疗多汗症”触发 OTC 药品',
    statute: '21 CFR Part 350 & 21 CFR 310.545 (OTC Antiperspirant vs. Cosmetic Deodorant)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-310/subpart-E/section-310.545',
    officialRefLabel: 'eCFR — 21 CFR 310.545 Unapproved OTC Active Ingredients',
    whyFlaggedEn:
      'Deodorants that merely mask or neutralize odor are cosmetics; products that claim to "stop sweat", "reduce perspiration", "block sweat glands", or treat "hyperhidrosis" are regulated as OTC Antiperspirant Drugs requiring approved aluminum actives and Drug Facts labeling.',
    whyFlaggedZh:
      '仅掩盖异味的体香剂属于化妆品，但一旦宣称“止汗（stops sweat）”、“减少出汗”或“治疗多汗症（hyperhidrosis）”，即升格为 OTC 止汗药，需要合规铝盐活性成分与 Drug Facts 药盒。',
    safeRewriteEn:
      'For aluminum-free cosmetic deodorants, replace sweat-blocking claims with: "helps neutralize odor all day", "absorbs surface wetness for a dry feel", and "keeps underarms feeling fresh".',
    safeRewriteZh:
      '无铝天然除臭剂应改为：“长效中和异味（neutralizes odor）”、“吸附表面湿气保持干爽体感（absorbs surface wetness）”，切勿写止汗或抑汗。',
    precedentEn:
      'Natural aluminum-free deodorants frequently trigger compliance removals when listing copy includes "antiperspirant" or "stops sweating" in bullets or backend search terms.',
    precedentZh:
      '天然无铝除臭棒常因标题或后台关键词带入“antiperspirant / stops sweat”被平台误杀。',
    patterns: [
      '\\b(stops?|blocks?|prevents?|reduces?|eliminates?|controls?)\\s+(\\w+\\s+){0,2}(sweat|sweating|perspiration|underarm\\s+sweat|excessive\\s+sweating|hyperhidrosis)\\b',
      '\\bantiperspirant\\b',
      '\\bhyperhidrosis\\b',
    ],
    seoQuestionEn: 'Can an aluminum-free natural deodorant claim "stops sweat" or "antiperspirant" on Amazon?',
    seoQuestionZh: '无铝天然除臭剂能在 Amazon 上写“止汗 / Antiperspirant”吗？',
  },
  {
    id: 'COS-LABEL-WARN',
    slug: 'cosmetic-mandatory-warning-statements-aha-aerosol',
    verticals: ['cosmetics'],
    category: 'Cosmetic Labeling & Colorants',
    severity: 'medium',
    weight: 16,
    titleEn: 'Mandatory Cosmetic Warning Statement Trigger (AHA Exfoliants / Aerosols / Tanning Oils)',
    titleZh: '化妆品强制警示语触发（果酸 AHA 晒伤提示 / 喷雾易燃 / 无防晒助晒油）',
    statute: '21 CFR Part 740 (Cosmetic Product Warning Statements) & FDA AHA Sunburn Alert Guidance',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-G/part-740',
    officialRefLabel: 'eCFR — 21 CFR Part 740 Cosmetic Product Warning Statements',
    whyFlaggedEn:
      'Under 21 CFR Part 740 and FDA AHA guidance, pressurized aerosol sprays, suntan oils without sunscreen (21 CFR 740.19), bubble baths (21 CFR 740.17), and high-strength AHA/glycolic/lactic/TCA chemical peels require specific verbatim safety warnings on packaging.',
    whyFlaggedZh:
      '依据 21 CFR Part 740 与 FDA 果酸指引，压力气雾罐、无防晒值的助晒油（740.19）、泡泡浴及高浓度果酸/甘醇酸/TCA 刷酸产品必须印制法定逐字安全警示语（如 Sunburn Alert）。',
    safeRewriteEn:
      'Include the required 21 CFR 740 verbatim warning on outer packaging (e.g., FDA Sunburn Alert for AHA peels, or 21 CFR 740.19 "does not contain a sunscreen" warning on tanning oils) and avoid medical "chemical peel destroys damaged layers" wording.',
    safeRewriteZh:
      '按 21 CFR 740 要求在外包装完整印制法定警示语（如 AHA 果酸防晒提示或助晒油无防晒声明），并避免使用医学剥脱宣称。',
    precedentEn:
      'FDA has warned online sellers of high-concentration TCA, phenol, and glycolic acid peels marketed directly to consumers without safety warnings.',
    precedentZh:
      'FDA 多次针对线上向普通消费者直售的高浓度 TCA/果酸化学换肤液发出警示。',
    patterns: [
      '\\b(tca\\s+peel|trichloroacetic\\s+acid|phenol\\s+peel|jessner\\s+peel|30%\\s+glycolic|50%\\s+glycolic|70%\\s+glycolic)\\b',
      '\\b(tanning\\s+oil|suntan\\s+oil|tan\\s+accelerator)\\b',
      '\\bchemical\\s+peel\\s+(kit|solution|acid)\\b',
    ],
    seoQuestionEn: 'What mandatory FDA warnings apply to AHA chemical peels, tanning oils, and cosmetic aerosols?',
    seoQuestionZh: '果酸换肤液、助晒油与气雾喷雾化妆品需要遵守哪些 21 CFR 740 强制警示语？',
  },
  {
    id: 'ING-COLOR-001',
    slug: 'unapproved-cosmetic-color-additives-kohl-henna-neon',
    verticals: ['cosmetics'],
    category: 'Cosmetic Labeling & Colorants',
    severity: 'critical',
    weight: 28,
    titleEn: 'Unapproved or Restricted Color Additive Trap (Kohl / Kajal / Black Henna / Neon Eye Pigments)',
    titleZh: '化妆品未获批色素红线（Kohl/Kajal 含铅眼线、黑海娜染眉/纹身、眼部荧光色素）',
    statute: '21 CFR Part 73 & FD&C Act §721 (FDA Color Additive Approval & Batch Certification)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-73',
    officialRefLabel: 'eCFR — 21 CFR Part 73 Listing of Color Additives Exempt from Certification',
    whyFlaggedEn:
      'Unlike most cosmetic ingredients, EVERY color additive used in U.S. cosmetics requires explicit FDA pre-market approval for its exact use area. Kohl/kajal/surma (lead risk), henna for skin/eyelash/eyebrow dyeing (only approved for hair), and non-eye-safe neon/fluorescent pigments trigger immediate detention and recalls.',
    whyFlaggedZh:
      '美国 FDA 对化妆品色素实行严格事前许可制且严格分区（眼部/唇部/外用）。Kohl/Kajal/Surma 传统眼线粉（含铅风险）、用于皮肤/染眉染睫的海娜（Henna 仅批准用于头发）及未获眼部批准的荧光霓虹色素均属非法掺假。',
    safeRewriteEn:
      'Verify every pigment (FD&C / D&C / CI number) against FDA’s approved Color Additives list for the exact application area (eye-area vs. lip vs. general external) and remove kohl, kajal, black henna, and unapproved neon eye glitters.',
    safeRewriteZh:
      '逐一核查配方中每个 CI/FD&C 色号是否获批用于对应部位（尤其眼部与唇部），彻底剔除 kohl、kajal、黑海娜及未获眼部许可的霓虹荧光色粉。',
    precedentEn:
      'FDA maintains standing Import Alerts detaining kohl/kajal eye cosmetics and unapproved neon eyeshadow palettes at U.S. ports.',
    precedentZh:
      'FDA 长期维持海关自动扣留令（Import Alert），高频拦截含铅 kohl/kajal 与未获眼部许可的荧光眼影盘。',
    patterns: [
      '\\b(kohl|kajal|surma|al[-\\s]?kahl)\\b',
      '\\b(black\\s+henna|ppd\\s+henna|henna\\s+(eyebrow|brow|lash|eyelash|skin|tattoo))\\b',
      '\\b(neon\\s+eyeshadow|fluorescent\\s+eye\\s+pigment|glow[-\\s]in[-\\s]the[-\\s]dark\\s+eyeshadow)\\b',
    ],
    seoQuestionEn: 'Why are kohl, kajal, henna brow dyes, and certain neon eyeshadow pigments illegal under FDA rules?',
    seoQuestionZh: '为什么 kohl、海娜染眉膏和部分霓虹荧光眼影会违反美国 FDA 色素法规？',
  },
  {
    id: 'COS-BIO-STEM',
    slug: 'exosomes-stem-cells-growth-factors-pdrn-biologic-claim',
    verticals: ['cosmetics', 'devices'],
    category: 'Medical Device / Biologics',
    severity: 'critical',
    weight: 28,
    titleEn: 'Unapproved Biologic / Regenerative Claim (Exosomes / Human Stem Cells / Growth Factors / PDRN)',
    titleZh: '生物制品/再生医学越界红线（外泌体 Exosomes / 干细胞 / 生长因子 / 基因修复）',
    statute: 'PHS Act §351 & FD&C Act §201(g) (FDA Regenerative Medicine & Biologics Enforcement)',
    officialRefUrl: 'https://www.fda.gov/vaccines-blood-biologics/consumers-biologics/important-patient-and-consumer-information-about-regenerative-medicine-therapies',
    officialRefLabel: 'FDA.gov — Regenerative Medicine, Stem Cells & Exosomes Enforcement',
    whyFlaggedEn:
      'FDA treats human-derived exosomes, human stem-cell conditioned media, and regenerative claims ("repairs damaged tissue", "activates stem cells", "regenerates DNA/dermis") as unapproved drugs or biological products. Exosome serums and injectable-style ampoules are a rapidly growing 2025–2026 FDA Warning Letter target.',
    whyFlaggedZh:
      'FDA 将人源外泌体（Exosomes）、干细胞再生疗法及“激活干细胞 / 修复 DNA / 再生真皮组织”等表述视作未获批药物或生物制品，是 2025–2026 年医美护肤与韩妆安瓶类目的重点打击对象。',
    safeRewriteEn:
      'Remove all human stem-cell, exosome regenerative, injectable/mesotherapy, and DNA/tissue repair claims. Keep topical cosmetics strictly within hydration and temporary appearance-smoothing language.',
    safeRewriteZh:
      '彻底删除外泌体再生、人源干细胞、水光针注射/中胚层导入及 DNA 组织修复宣称，回归表面保湿与改善肤质外观表述。',
    precedentEn:
      'FDA CBER has issued public consumer alerts and Warning Letters against unapproved exosome and stem-cell aesthetic products.',
    precedentZh:
      'FDA 生物制品中心（CBER）已多次发布针对未获批外泌体与干细胞抗衰产品的安全警告及警告信。',
    patterns: [
      '\\b(exosomes?|human\\s+stem\\s+cells?|umbilical\\s+stem\\s+cells?|amniotic\\s+fluid|placental\\s+stem)\\b',
      '\\b(activates?|regenerates?|repairs?)\\s+(\\w+\\s+){0,2}(stem\\s+cells?|human\\s+dna|cellular\\s+dna|dermal\\s+tissue)\\b',
      '\\b(mesotherapy\\s+ampoule|injectable\\s+serum|diy\\s+hyaluronic\\s+filler|hyaluron\\s+pen)\\b',
    ],
    seoQuestionEn: 'Are exosome serums, stem-cell creams, and hyaluron pens allowed on Amazon or under FDA rules?',
    seoQuestionZh: '外泌体精华、干细胞抗衰霜或无针水光笔（Hyaluron Pen）可以在美国站合法售卖吗？',
  },
  {
    id: 'COS-ESS-OIL',
    slug: 'essential-oil-aromatherapy-disease-treatment-claims',
    verticals: ['cosmetics', 'general'],
    category: 'Drug Claim',
    severity: 'high',
    weight: 24,
    titleEn: 'Essential Oil / Aromatherapy Therapeutic Disease Claim (Sinus / Asthma / Migraine / Seizures)',
    titleZh: '精油/芳疗越界医疗宣称（治鼻窦炎/哮喘/偏头痛/癫痫/杀空气病毒）',
    statute: 'FD&C Act §201(g)(1)(B) — Intended Use & Aromatherapy Drug Boundary',
    officialRefUrl: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/it-cosmetic-drug-or-both-or-it-soap',
    officialRefLabel: 'FDA.gov — Cosmetic, Drug, or Aromatherapy Intended Use',
    whyFlaggedEn:
      'Essential oils are cosmetics or fragrances ONLY when marketed for pleasant scent or cosmetic cleansing. Claiming an essential oil relieves sinus congestion, treats asthma, stops migraines, calms seizures, or purifies airborne viruses makes it an unapproved new drug.',
    whyFlaggedZh:
      '精油仅用于芳香气味或基础洁肤时才属化妆品/香氛。一旦宣称缓解鼻窦充血、治疗哮喘、止偏头痛或净化空气病毒，立刻沦为未获批药物或非法农药。',
    safeRewriteEn:
      'Market essential oils strictly for scent and ambiance: "crisp, invigorating eucalyptus aroma for diffusers", "relaxing lavender scent for evening wind-down routines".',
    safeRewriteZh:
      '严格限定为香氛与氛围体验：“清新提神的尤加利扩香气息”、“舒缓放松的薰衣草夜间香氛”。',
    precedentEn:
      'FDA has sent numerous Warning Letters to essential oil brands citing therapeutic diffusion and topical disease claims.',
    precedentZh:
      'FDA 曾向多家头部及中小精油品牌签发警告信，点名批评其扩香治病与鼻腔通气宣称。',
    patterns: [
      '\\b(essential\\s+oil|aromatherapy)\\s+(\\w+\\s+){0,4}(cures?|treats?|relieves?|stops?|heals?)\\s+(\\w+\\s+){0,2}(sinus|asthma|bronchitis|migraines?|headaches?|seizures?|infections?|allergies|congestion)\\b',
      '\\b(clears?\\s+sinus\\s+infections?|purifies?\\s+airborne\\s+viruses?|therapeutic\\s+grade\\s+essential\\s+oil)\\b',
    ],
    seoQuestionEn: 'Can essential oils claim "therapeutic grade", sinus relief, or headache cure on Amazon?',
    seoQuestionZh: '精油产品能在 Amazon 上写“Therapeutic Grade”、缓解鼻窦炎或止头痛吗？',
  },
  {
    id: 'SUP-OTC-COLD',
    slug: 'cold-cough-allergy-asthma-bronchodilator-otc-drug',
    verticals: ['supplements', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'critical',
    weight: 26,
    titleEn: 'OTC Cold, Cough, Allergy & Asthma Drug Claim (Decongestant / Antihistamine / Bronchodilator)',
    titleZh: '感冒止咳/抗过敏/哮喘类 OTC 药品越界宣称（祛痰/通鼻/抗组胺/支气管扩张）',
    statute: '21 CFR Part 341 (Cold, Cough, Allergy, Bronchodilator & Antiasthmatic OTC Products)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-341',
    officialRefLabel: 'eCFR — 21 CFR Part 341 Cold, Cough, Allergy & Asthma OTC Monograph',
    whyFlaggedEn:
      'Dietary supplements cannot claim to act as a cough suppressant, decongestant, expectorant, or natural antihistamine, nor treat seasonal allergies, hay fever, sinusitis, bronchitis, or asthma—all of which belong strictly to 21 CFR Part 341 OTC Drugs or Rx drugs.',
    whyFlaggedZh:
      '膳食补充剂绝不允许宣称具备止咳、通鼻减充血（decongestant）、祛痰（expectorant）、天然抗组胺（natural antihistamine）功效，或治疗花粉过敏、鼻炎、支气管炎与哮喘。',
    safeRewriteEn:
      'Use compliant respiratory wellness framing: "supports clear seasonal breathing comfort*", "supports healthy upper-respiratory mucosal wellness*" (+ mandatory DSHEA disclaimer).',
    safeRewriteZh:
      '改用日常呼吸养护表达：“支持换季呼吸舒适感*（seasonal breathing comfort）”、“支持上呼吸道日常健康*”（附 DSHEA 免责声明）。',
    precedentEn:
      'Quercetin, mullein leaf, stinging nettle, and NAC supplements frequently trigger Amazon flags for "allergy relief" and "clears mucus / asthma".',
    precedentZh:
      '槲皮素（Quercetin）、毛蕊花叶、荨麻提取物与 NAC 补剂常因写“allergy relief / clears mucus / asthma”遭平台扫号。',
    patterns: [
      '\\b(cough\\s+suppressant|natural\\s+antihistamine|decongestant|expectorant|bronchodilator)\\b',
      '\\b(relieve|relieves|treat|treats|cure|cures|stop|stops|prevent|prevents|for)\\s+(\\w+\\s+){0,2}(asthma|bronchitis|sinusitis|hay\\s+fever|seasonal\\s+allergies|allergy\\s+symptoms|copd|wheezing|sinus\\s+congestion)\\b',
      '\\b(allergy|asthma|cough|sinus)\\s+(cure|treatment|medicine|remedy)\\b',
    ],
    seoQuestionEn: 'Can mullein leaf or quercetin supplements claim "allergy relief", "expectorant", or "asthma support"?',
    seoQuestionZh: '毛蕊花叶或槲皮素补剂能在 Amazon 上写“allergy relief / expectorant / asthma”吗？',
  },
  {
    id: 'SUP-OTC-ANTACID',
    slug: 'antacid-diarrhea-constipation-laxative-otc-drug',
    verticals: ['supplements', 'general'],
    category: 'OTC Monograph Drug',
    severity: 'high',
    weight: 22,
    titleEn: 'OTC Antacid / Laxative / Antidiarrheal / Hemorrhoid Drug Claim',
    titleZh: '抗酸剂/通便泻药/止泻/痔疮类 OTC 药品越界宣称',
    statute: '21 CFR Part 331 (Antacid OTC Monograph) & 21 CFR 101.93(g)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-331',
    officialRefLabel: 'eCFR — 21 CFR Part 331 Antacid Products for OTC Human Use',
    whyFlaggedEn:
      'Claiming a dietary supplement acts as an antacid, neutralizes stomach acid, stops diarrhea, treats chronic constipation, or shrinks hemorrhoids reclassifies it as an OTC drug under 21 CFR Part 331 / digestive drug monographs.',
    whyFlaggedZh:
      '保健品宣称“抗酸剂（antacid）”、“中和胃酸”、“止泻（stops diarrhea）”、“治疗顽固便秘”或“消除痔疮（hemorrhoids）”，会直接触碰 OTC 消化道药品专论红线。',
    safeRewriteEn:
      'Reframe to mild everyday regularity: "supports healthy digestive balance and occasional regularity*", "soothes occasional mild stomach discomfort*" (+ mandatory DSHEA disclaimer).',
    safeRewriteZh:
      '改写为温和日常养护：“支持健康消化平衡与日常排便规律*（occasional regularity）”、“舒缓偶发轻微胃部不适*”。',
    precedentEn:
      'Digestive enzyme, senna tea, and fiber supplements draw rapid Amazon bot takedowns when mentioning "antacid", "diarrhea cure", or "hemorrhoid treatment".',
    precedentZh:
      '消化酶、番泻叶茶与益生元纤维粉因出现“antacid / stops diarrhea / hemorrhoids”频繁触发 Amazon 下架。',
    patterns: [
      '\\b(antacid|neutralizes?\\s+stomach\\s+acid|stops?\\s+diarrhea|cures?\\s+diarrhea|treats?\\s+constipation|cures?\\s+constipation)\\b',
      '\\b(shrinks?|cures?|treats?|heals?|eliminates?)\\s+(\\w+\\s+){0,2}(hemorrhoids?|stomach\\s+ulcers?|gastritis|diverticulitis)\\b',
    ],
    seoQuestionEn: 'Can digestive enzymes or probiotics claim to neutralize stomach acid or stop diarrhea?',
    seoQuestionZh: '消化酶或益生菌补剂可以写“中和胃酸”、“止泻”或“治便秘”吗？',
  },
  {
    id: 'SUP-ING-CBD',
    slug: 'cbd-cannabidiol-delta8-thc-amazon-fda-ban',
    verticals: ['supplements', 'cosmetics', 'pets', 'general'],
    category: 'Prohibited / Tainted Ingredient',
    severity: 'critical',
    weight: 35,
    titleEn: 'CBD / Cannabidiol / Delta-8 THC Prohibited Ingredient (FDA & Amazon Zero-Tolerance Ban)',
    titleZh: '红线禁售成分：CBD / 大麻二酚 / Delta-8 THC（FDA 警告信与 Amazon 绝对禁售）',
    statute: 'FD&C Act §201(ff)(3)(B) & Amazon Prohibited Hemp/CBD Policy',
    officialRefUrl: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    officialRefLabel: 'FDA.gov — Regulation of Cannabis and Cannabidiol (CBD) Products',
    whyFlaggedEn:
      'FDA maintains that CBD cannot legally be marketed as a dietary supplement or added to food, and Amazon strictly prohibits ALL ingestible and topical CBD, Delta-8, Delta-9, HHC, and full-spectrum cannabinoid listings—resulting in instant ASIN deletion and fund freezes.',
    whyFlaggedZh:
      'FDA 认定 CBD 不能合法作为膳食补充剂或食品添加剂销售，且 Amazon 对所有含 CBD、Delta-8/Delta-9、全谱大麻素（full-spectrum cannabinoids）的口服与外用品实行零容忍秒杀并可能冻结资金。',
    safeRewriteEn:
      'Remove ALL mentions of CBD, cannabidiol, Delta-8, Delta-9, THC, and "full-spectrum hemp extract" from titles, bullets, packaging, and backend keywords. (Only plain cold-pressed hemp seed oil without cannabinoids is permitted on Amazon.)',
    safeRewriteZh:
      '彻底清除标题、五点、包装与后台词中一切 CBD、Cannabidiol、Delta-8、THC 与全谱大麻提取物字样（Amazon 仅允许不含大麻素的普通冷压火麻仁油 Hemp Seed Oil）。',
    precedentEn:
      'Hundreds of FDA Warning Letters have targeted CBD & Delta-8 gummies, tinctures, creams, and pet treats.',
    precedentZh:
      'FDA 已对数百家 CBD 与 Delta-8 软糖、滴剂、止痛膏及宠物零食卖家签发警告信。',
    patterns: [
      '\\b(cbd|cannabidiol|delta[-\\s]?8|delta[-\\s]?9|delta[-\\s]?10|thc[-\\s]?a|hhc|full[-\\s]?spectrum\\s+hemp\\s+extract|broad[-\\s]?spectrum\\s+hemp\\s+extract|phytocannabinoids?)\\b',
    ],
    seoQuestionEn: 'Can you sell CBD, full-spectrum hemp extract, or Delta-8 products on Amazon US?',
    seoQuestionZh: '可以在 Amazon 美国站销售 CBD、全谱大麻提取物或 Delta-8 产品吗？',
  },
  {
    id: 'SUP-ING-NDI',
    slug: 'colloidal-silver-bpc157-sarms-phenibut-drug-precluded',
    verticals: ['supplements', 'cosmetics', 'general'],
    category: 'Prohibited / Tainted Ingredient',
    severity: 'critical',
    weight: 34,
    titleEn: 'High-Enforcement Unapproved Compound (Colloidal Silver / BPC-157 / SARMs / Phenibut / Racetams)',
    titleZh: '高危禁售/未获批化合物（胶体银 / BPC-157 多肽 / SARMs / 菲尼布特 / 吡拉西坦）',
    statute: '21 CFR 310.548 (Colloidal Silver) & 21 CFR 310.545 / FD&C Act §201(ff)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-310/subpart-E/section-310.545',
    officialRefLabel: 'eCFR — 21 CFR 310.545 Unapproved OTC Drugs & Restricted Compounds',
    whyFlaggedEn:
      'Colloidal silver, research peptides (BPC-157, TB-500, Ipamorelin), SARMs (Ostarine, Ligandrol, RAD-140, MK-677), Phenibut, Vinpocetine, Piracetam, and DMAA/DMBA are heavily enforced by FDA Warning Letters and banned on Amazon & TikTok Shop.',
    whyFlaggedZh:
      '胶体银（Colloidal Silver）、研究多肽（BPC-157 / TB-500）、SARMs（Ostarine / RAD-140 / MK-677）、Phenibut、长春西汀与吡拉西坦均属 FDA 警告信高压线及 Amazon/TikTok 禁售品。',
    safeRewriteEn:
      'Immediately remove prohibited research peptides, SARMs, phenibut, racetams, or colloidal silver health claims from your catalog before inventory is stranded or seized.',
    safeRewriteZh:
      '立即从在售目录中移除上述研究肽、SARMs、菲尼布特、拉西坦或胶体银健康宣称，防止库存被扣押销毁。',
    precedentEn:
      'FDA issued repeated Warning Letters targeting BPC-157 capsules, SARMs muscle builders, phenibut nootropics, and colloidal silver sprays.',
    precedentZh:
      'FDA 近期连续向售卖 BPC-157 胶囊、SARMs 增肌粉、Phenibut 益智补剂与胶体银喷雾的商家发出警告信。',
    patterns: [
      '\\b(colloidal\\s+silver|nano\\s+silver\\s+(drops?|spray|supplement)|bpc[-\\s]?157|tb[-\\s]?500|mk[-\\s]?677|ibutamoren|ostarine|mk[-\\s]?2866|ligandrol|lgd[-\\s]?4033|rad[-\\s]?140|testolone|sarms|phenibut|vinpocetine|piracetam|aniracetam|oxiracetam|noopept|adrafinil|tianeptine|picamilon|dmba)\\b',
    ],
    seoQuestionEn: 'Are BPC-157, SARMs, Phenibut, Piracetam, or Colloidal Silver legal dietary supplements in the U.S.?',
    seoQuestionZh: 'BPC-157、SARMs、Phenibut、吡拉西坦或胶体银在美国可以作为保健品售卖吗？',
  },
  {
    id: 'SUP-DIS-INTIMATE',
    slug: 'womens-intimate-bv-fertility-pregnancy-infant-claims',
    verticals: ['supplements', 'cosmetics', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Intimate Health, Fertility, Pregnancy & Infant Disease Claim (BV / Infertility / Colic / Ear Infection)',
    titleZh: '私护/备孕/母婴高危疾病宣称（细菌性阴道炎 BV / 助孕治不孕 / 婴儿肠绞痛 / 中耳炎）',
    statute: '21 CFR 101.93(g)(2) — Urogenital, Reproductive & Pediatric Disease Claims',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-F/section-101.93',
    officialRefLabel: 'eCFR — 21 CFR 101.93 Disease Claim Criteria',
    whyFlaggedEn:
      'Boric acid suppositories or women’s probiotics claiming to cure bacterial vaginosis (BV), vaginal infections, or infertility—and baby drops claiming to cure infant colic, ear infections, or teething pain—are strictly prohibited drug claims under FDA rules.',
    whyFlaggedZh:
      '硼酸栓/女性益生菌宣称治疗细菌性阴道炎（BV）、妇科感染或不孕不育，以及母婴滴剂宣称治疗婴儿肠绞痛（colic）、中耳炎或出牙止痛，均属 FDA 严查高危药物宣称。',
    safeRewriteEn:
      'Use gentle wellness wording only: "supports healthy vaginal pH balance*", "supports everyday reproductive wellness*", or "helps soothe occasional fussy tummies*" (never treat BV, infections, infertility, or pediatric diseases).',
    safeRewriteZh:
      '改用日常平衡表达：“支持女性私处健康 pH 平衡*”、“支持备孕期日常营养*”，绝不触碰 BV、感染、不孕或婴儿疾病词。',
    precedentEn:
      'Women’s probiotic capsules, boric acid products, and homeopathic baby colic/teething drops face heightened FDA and Amazon pediatric safety enforcement.',
    precedentZh:
      '女性硼酸/益生菌产品及母婴肠绞痛/出牙滴剂是 FDA 与 Amazon 儿科安全审查重灾区。',
    patterns: [
      '\\b(treats?|cures?|clears?|stops?|eliminates?|prevents?|for)\\s+(\\w+\\s+){0,2}(bacterial\\s+vaginosis|bv\\s+infections?|vaginal\\s+infections?|infertility|miscarriage|infant\\s+colic|baby\\s+colic|ear\\s+infections?|otitis|thrush|mastitis)\\b',
      '\\b(cures?\\s+bv|bv\\s+(treatment|cure|remedy)|fertility\\s+cure|prevents?\\s+miscarriage)\\b',
    ],
    seoQuestionEn: 'Can women’s probiotics or boric acid products claim to cure bacterial vaginosis (BV) or infertility?',
    seoQuestionZh: '女性益生菌或硼酸产品能在 Amazon 上写治疗细菌性阴道炎（BV）或助孕治不孕吗？',
  },
  {
    id: 'SUP-DIS-EYE-NEURO',
    slug: 'tinnitus-macular-degeneration-thyroid-withdrawal-disease-claims',
    verticals: ['supplements', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Vision, Hearing, Thyroid & Addiction Disease Claim (Tinnitus / Macular Degeneration / Hashimoto’s / Withdrawal)',
    titleZh: '耳鸣/黄斑变性/甲减桥本/戒断反应等明确疾病宣称',
    statute: '21 CFR 101.93(g) — Explicit Disease & Addiction Treatment Claims',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-F/section-101.93',
    officialRefLabel: 'eCFR — 21 CFR 101.93 Explicit Disease Criteria',
    whyFlaggedEn:
      'Tinnitus (ringing in the ears), macular degeneration, hypothyroidism/Hashimoto’s, lupus, multiple sclerosis, and opioid/alcohol withdrawal are explicit medical diseases. Supplements targeting these conditions are top targets for FDA/FTC joint health-fraud enforcement.',
    whyFlaggedZh:
      '耳鸣（Tinnitus）、黄斑变性、甲减/桥本氏甲状腺炎、红斑狼疮及戒毒/戒酒戒断反应均属明确临床疾病，保健品提及这些词极易招致 FDA 与 FTC 联合健康欺诈执法。',
    safeRewriteEn:
      'Switch to general nutritional support: "supports healthy eye nutrition with lutein & zeaxanthin*", "supports normal thyroid nutrient intake*", "supports healthy inner-ear microcirculation*".',
    safeRewriteZh:
      '转为营养素基础支持：“提供叶黄素支持日常眼部营养*”、“支持正常甲状腺营养所需*”，彻底删除耳鸣、黄斑病变与桥本字样。',
    precedentEn:
      'Tinnitus relief drops and "opioid/alcohol withdrawal" botanical capsules have drawn aggressive FDA Warning Letters and injunctions.',
    precedentZh:
      '耳鸣缓解滴剂与甲状腺/戒断类草本胶囊曾屡次遭遇 FDA 警告信与联邦禁令。',
    patterns: [
      '\\b(tinnitus\\s+(relief|cure|treatment|drops?|remedy)|stops?\\s+(ear\\s+)?ringing|cures?\\s+tinnitus)\\b',
      '\\b(treats?|cures?|reverses?|prevents?|relieves?|stops?)\\s+(\\w+\\s+){0,2}(macular\\s+degeneration|hashimoto[\'’]?s|hypothyroidism|hyperthyroidism|thyroid\\s+disease|lupus|multiple\\s+sclerosis|opioid\\s+withdrawal|alcohol\\s+withdrawal|addiction)\\b',
    ],
    seoQuestionEn: 'Can supplements claim "tinnitus relief", "reverses macular degeneration", or "treats Hashimoto’s"?',
    seoQuestionZh: '保健品可以写“缓解耳鸣（tinnitus relief）”或“调理桥本甲状腺炎”吗？',
  },
  {
    id: 'SUP-CGMP-001',
    slug: 'prescription-strength-rx-replacement-claim',
    verticals: ['supplements', 'cosmetics', 'general'],
    category: 'Disease Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Illegal "Prescription Strength" / "Replaces Your Medication" Drug Implication',
    titleZh: '违规宣称“处方级强度（Prescription Strength）/ 替代西药”暗示药物等效',
    statute: '21 CFR 101.93(g)(2)(ix) & 21 CFR Part 111 (Implied Drug Equivalence)',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-111',
    officialRefLabel: 'eCFR — 21 CFR Part 111 Dietary Supplement cGMP & Regulatory Framework',
    whyFlaggedEn:
      'Under 21 CFR 101.93(g)(2)(ix), claiming a supplement or cosmetic is "prescription strength", "Rx grade", "pharmaceutical grade", or acts as a substitute for prescription drugs (statins, metformin, Adderall, Xanax, Ozempic) is automatically an illegal drug claim.',
    whyFlaggedZh:
      '依据 21 CFR 101.93(g)(2)(ix)，将保健品或护肤品称为“处方强度（prescription strength）”、“药用级（Rx grade）”或宣称可替代他汀/二甲双胍/处方药，直接构成隐性违法药物宣称。',
    safeRewriteEn:
      'Replace drug-comparison phrasing with factual potency disclosures: "concentrated botanical extract", "standardized to 95% curcuminoids", or "high-potency daily formula*".',
    safeRewriteZh:
      '改为客观提取浓度描述：“高浓缩植物提取物”、“标准化 95% 有效成分含量”，严禁与任何处方药对比或称处方级。',
    precedentEn:
      'FDA Warning Letters explicitly quote "natural alternative to Adderall/Xanax/Metformin" and "prescription strength" as direct proof of drug intent.',
    precedentZh:
      'FDA 警告信多次直接截取“天然替代 Adderall/二甲双胍”与“prescription strength”作为违法定性铁证。',
    patterns: [
      '\\b(prescription[-\\s]?strength|rx[-\\s]?strength|rx[-\\s]?grade|pharmaceutical[-\\s]?grade\\s+treatment)\\b',
      '\\b(replaces?|substitute\\s+for|natural\\s+alternative\\s+to|ditch\\s+your|stop\\s+taking\\s+your)\\s+(\\w+\\s+){0,2}(prescription|medication|meds|statins?|metformin|adderall|xanax|prozac|antibiotics|insulin|steroids?)\\b',
    ],
    seoQuestionEn: 'Can a supplement or skincare cream say "prescription strength" or "natural alternative to prescription meds"?',
    seoQuestionZh: '保健品或面霜可以在详情页写“Prescription Strength”或“处方药天然替代”吗？',
  },
  {
    id: 'PET-DRUG-001',
    slug: 'pet-supplement-unapproved-animal-drug-claim',
    verticals: ['pets', 'general'],
    category: 'Animal / Pet Drug Claim',
    severity: 'critical',
    weight: 28,
    titleEn: 'Unapproved Animal / Pet Drug Claim (Dog Arthritis / Seizures / Hot Spots / Kennel Cough / Fleas)',
    titleZh: '宠物补剂/洗护未获批兽药违规（犬猫关节炎/癫痫/热斑皮炎/耳螨/驱虫杀蚤）',
    statute: '21 CFR Part 510 (New Animal Drugs) & FDA CVM Enforcement Policy',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-510',
    officialRefLabel: 'eCFR — 21 CFR Part 510 New Animal Drugs',
    whyFlaggedEn:
      'Crucial trap for Amazon Pet Supplies sellers: DSHEA does NOT apply to animals! FDA CVM enforces even stricter drug-claim rules on dog/cat chews, ear washes, and shampoos claiming to treat arthritis, hip dysplasia, anxiety, seizures, hot spots, mange, kennel cough, UTIs, or kill fleas/ticks (also an EPA pesticide trigger).',
    whyFlaggedZh:
      '宠物卖家最易踩的致命盲区：美国 DSHEA 膳食补充剂法**不适用于宠物**！FDA 兽药中心（CVM）对犬猫软糖、洗耳液、香波监管更严，写“治关节炎/髋关节发育不良/分离焦虑/热斑皮炎/耳部感染/杀跳蚤蜱虫”极易触发兽药与 EPA 农药双重下架。',
    safeRewriteEn:
      'Use conservative pet-nutrition/grooming language: "supports healthy hip & joint mobility in active dogs", "helps maintain calm behavior during travel or fireworks", "gently cleanses skin and coat".',
    safeRewriteZh:
      '收敛为保守宠物营养与日常洗护表述：“支持活跃犬只关节灵活度”、“帮助旅行或雷雨时维持平静状态”、“温和清洁被毛与皮肤”。',
    precedentEn:
      'FDA CVM routinely issues Warning Letters to online pet supplement brands claiming to treat canine arthritis, hip dysplasia, ear infections, and hot spots.',
    precedentZh:
      'FDA 兽药中心（CVM）持续对宣称治疗犬猫关节炎、皮肤热斑与耳部感染的线上宠物品牌发警告信。',
    patterns: [
      '\\b(treats?|cures?|heals?|stops?|prevents?|relieves?|for)\\s+(\\w+\\s+){0,3}(hip\\s+dysplasia|kennel\\s+cough|mange|hot\\s+spots?|canine\\s+arthritis|dog\\s+arthritis|pet\\s+arthritis|dog\\s+anxiety|separation\\s+anxiety|pet\\s+seizures?|dog\\s+seizures?|heartworm|ear\\s+mites?|dog\\s+ear\\s+infections?)\\b',
      '\\b(kills?|repels?|eliminates?)\\s+(\\w+\\s+){0,2}(fleas?|ticks?|heartworms?|ringworms?|ear\\s+mites?)\\b',
      '\\b(xylitol|birch\\s+sugar)\\b',
    ],
    seoQuestionEn: 'Can dog joint chews, calming treats, or pet shampoos claim to treat arthritis, hot spots, or fleas on Amazon?',
    seoQuestionZh: '宠物关节软糖、安抚零食或沐浴露可以在 Amazon 上写治疗关节炎、热斑或杀跳蚤吗？',
  },
  {
    id: 'DEV-QSR-002',
    slug: 'uncleared-blood-glucose-watch-plasma-pen-hifu-microneedling',
    verticals: ['devices'],
    category: 'Medical Device / Biologics',
    severity: 'critical',
    weight: 30,
    titleEn: 'Uncleared High-Risk Device Claim (Non-Invasive Blood Glucose Watch / Plasma Pen / HIFU / Deep Microneedling)',
    titleZh: '高危未获批器械红线（无创测血糖手表 / 等离子点痣笔 / 家用超声刀 HIFU / 深层微针）',
    statute: '21 CFR Part 820 (QSR/QMSR) & FDA Safety Communications on Unapproved Aesthetic/Monitoring Devices',
    officialRefUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820',
    officialRefLabel: 'eCFR — 21 CFR Part 820 Quality System Regulation (Medical Devices)',
    whyFlaggedEn:
      'FDA has explicitly warned that NO smartwatch or smart ring is FDA-authorized to measure blood glucose non-invasively. Likewise, plasma fibroblast pens, mole-removal pens, home HIFU ultrasound lifts, and microneedling pens (>0.3mm / penetrating living dermis) are regulated medical devices requiring 510(k)/PMA clearance and 21 CFR 820 compliance.',
    whyFlaggedZh:
      'FDA 已明文警告目前全球尚无任何智能手表/指环获批“无创测血糖”；同时等离子点痣笔（Plasma Pen）、家用 HIFU 超声刀与穿透真皮层的深层微针（>0.3mm）均属受控医疗器械，无 510(k) 必被封杀。',
    safeRewriteEn:
      'Remove ALL blood-glucose / blood-pressure diagnostic claims from non-cleared wearables. For cosmetic rollers without 510(k), stay strictly <=0.25mm exfoliation-appearance only and remove plasma-pen, mole-removal, and HIFU/ultrasound lifting claims.',
    safeRewriteZh:
      '非持证穿戴设备立即删除一切无创血糖/血压医疗监测词；无 510(k) 的美容滚轮严禁写穿透真皮/点痣/HIFU 超声刀提拉。',
    precedentEn:
      'FDA issued dedicated Safety Communications warning consumers and marketplaces against non-invasive glucose smartwatches and unapproved microneedling/plasma devices.',
    precedentZh:
      'FDA 已针对无创血糖手表与未获批点痣/微针器械发布过专项联邦安全警告。',
    patterns: [
      '\\b(non[-\\s]?invasive\\s+(blood\\s+)?glucose|measures?\\s+blood\\s+sugar|blood\\s+glucose\\s+(smartwatch|watch|ring)|painless\\s+glucose\\s+monitor)\\b',
      '\\b(plasma\\s+(fibroblast\\s+)?pen|mole\\s+removal\\s+pen|skin\\s+tag\\s+removal\\s+pen|home\\s+hifu|hifu\\s+(machine|device|lifting)|microneedling\\s+pen|derma\\s+pen\\s+(1\\.0|1\\.5|2\\.0|2\\.5)\\s*mm)\\b',
    ],
    seoQuestionEn: 'Can you sell non-invasive blood glucose smartwatches, plasma mole pens, or microneedling pens on Amazon?',
    seoQuestionZh: '无创测血糖智能手表、等离子点痣笔或深层微针笔可以在 Amazon 美国站销售吗？',
  },
  {
    id: 'FTC-SUB-002',
    slug: 'ftc-zero-side-effects-100-safe-number-one-doctor-claim',
    verticals: ['cosmetics', 'supplements', 'devices', 'pets', 'general'],
    category: 'FTC Substantiation',
    severity: 'medium',
    weight: 16,
    titleEn: 'Unsubstantiated Absolute Safety / "#1 Doctor Recommended" Claim (FTC Act §12)',
    titleZh: 'FTC 绝对安全/无副作用/“第一医生推荐”高风险夸大宣称',
    statute: 'FTC Act §§5 & 12 (15 U.S.C. §§45, 52) & FTC Endorsement Guides',
    officialRefUrl: 'https://www.law.cornell.edu/uscode/text/15/52',
    officialRefLabel: '15 U.S.C. §52 — FTC Act §12 False Advertisement Prohibition',
    whyFlaggedEn:
      'Claiming a supplement, cosmetic, or device has "zero side effects", is "100% safe for everyone", or is "#1 Doctor / Dermatologist Recommended" without a statistically valid nationwide survey or clinical safety substantiation violates FTC Act §§5 & 12 and invites NAD/competitor takedown complaints.',
    whyFlaggedZh:
      '缺乏全国统计调查或成品临床证据却宣称“零副作用（zero side effects）”、“对所有人 100% 安全”或“#1 皮肤科医生推荐”，违反 FTC 法案且极易被竞品向 Amazon/NAD 精准举报。',
    safeRewriteEn:
      'Replace absolute claims with verifiable wording: "gentle formula suitable for daily routines", "dermatologist-tested" (only if you hold the RIPT lab certificate), and include standard sensitivity patch-test guidance.',
    safeRewriteZh:
      '改为可自证的温和表述：“温和配方适合日常护理”、“经皮肤科测试（需持有第三方 RIPT 斑贴测试报告）”，切忌写零副作用或 100% 安全。',
    precedentEn:
      'Competitor-filed Amazon Policy Violations and FTC warning sweeps frequently target "#1 Dermatologist Recommended" and "100% safe / zero side effects" badges.',
    precedentZh:
      '“#1 医生推荐”与“零副作用/100%安全”是海外竞品恶意投诉与 FTC 抽查的常见突破口。',
    patterns: [
      '\\b(zero|no)\\s+side\\s+effects\\b',
      '\\b100%\\s+safe\\s+(for\\s+everyone|with\\s+no\\s+side\\s+effects|guaranteed)\\b',
      '\\b#?1\\s+(doctor|dermatologist|vet|veterinarian|physician)[-\\s]+(recommended|approved|trusted)\\b',
      '\\bcompletely\\s+risk[-\\s]?free\\s+(treatment|cure|formula)\\b',
    ],
    seoQuestionEn: 'Can an Amazon product claim "zero side effects", "100% safe", or "#1 Dermatologist Recommended"?',
    seoQuestionZh: 'Amazon 商品能写“Zero Side Effects（零副作用）”或“#1 皮肤科医生推荐”吗？',
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
      'FDA Approved Retinol & Exosome Anti-Acne Serum – Treats Acne, Reduces Inflammation & Stimulates Collagen Production',
    bullets:
      '• Clinically proven to clear stubborn cystic acne and heal eczema redness fast.\n• Botox alternative formula permanently eliminates deep wrinkles and repairs sun damage at the cellular level.\n• Antibacterial tea tree complex kills 99.9% of bacteria on skin with zero side effects.\n• Manufactured in a facility with official FDA Certificate.',
    ingredients:
      'Water, Glycerin, Retinol, Niacinamide, Hydroquinone 2%, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Fragrance.',
  },
  supplement: {
    id: 'supplement',
    labelEn: 'Berberine + Ashwagandha (Illustrative Risk Example)',
    labelZh: '小檗碱 + 奶蓟草（高危演示样本）',
    vertical: 'supplements',
    title:
      'Nature’s Ozempic Berberine Complex 1200mg – Prescription Strength, Lowers Blood Sugar & Hangover Cure',
    bullets:
      '• Supports healthy metabolism and helps lower blood pressure and LDL cholesterol naturally.\n• Fast-acting anxiety relief and cures insomnia without prescription drugs.\n• Relieves acid reflux, GERD, seasonal allergies, and arthritis joint pain.\n• FDA Approved facility; 100% guaranteed results in 14 days.',
    ingredients:
      'Berberine HCl 1200mg, Ashwagandha Root Extract 300mg, Milk Thistle, Yohimbine HCl, DMHA.',
  },
  device: {
    id: 'device',
    labelEn: 'Red Light LED Mask (Illustrative Risk Example)',
    labelZh: '红光 LED 美容面罩（高危演示样本）',
    vertical: 'devices',
    title:
      'FDA Approved Medical-Grade Red Light Therapy LED Face Mask & Home HIFU – Cures Acne & Relieves Neuropathy',
    bullets:
      '• Hospital-grade therapeutic laser & IPL permanent hair removal technology.\n• Relieves chronic pain, joint pain, and neuropathy in 10 minutes a day.\n• Product is FDA-Registered; also includes non-invasive blood glucose smartwatch companion.',
    ingredients: 'Medical-grade silicone shell, 630nm LED array, USB-C controller.',
  },
  pet: {
    id: 'pet',
    labelEn: 'Dog Joint & Skin Chew (Illustrative Risk Example)',
    labelZh: '宠物关节与皮肤软糖（高危演示样本）',
    vertical: 'pets',
    title:
      'CBD Hemp Dog Chews – Treats Canine Arthritis, Hip Dysplasia, Separation Anxiety & Hot Spots',
    bullets:
      '• Prescription strength formula cures dog ear infections and kennel cough naturally.\n• Kills fleas and ticks from the inside out with zero side effects.\n• #1 Veterinarian Recommended cure for pet seizures.',
    ingredients: 'Full-Spectrum Hemp Extract (CBD 15mg), Glucosamine, Chondroitin, Turmeric.',
  },
};
