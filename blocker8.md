---
id: 8
title: User Adoption
badge: P1-后台
badge-class: p1
status: 待验证
status-class: pending
subtitle: Day 1 部署 usage analytics 后台收集，Week 4+ 启动主动验证
---

## 基本信息
| 架构图位置 | 无直接对应 ⚠️ — 架构图只展示技术拓扑，不展示用户行为 |
| Blocker 状态 | 这是一个预判性假设 |
| 数据来源 | 当前产能仅为目标的 ~5% — 即使部分技术问题存在，95% 的产能 gap 是否全部由技术问题解释？有可能系统部分可用但用户未迁移过来 |
| Priority | 取决于 H1/H2 的验证结果；如果技术修复后系统实际使用率仍未上升，则此假设升级为 P0 |
| 假设归属 | H2: 组织与流程 |
| 怀疑方向 | 技术部署可能部分可用，但终端用户未切换到新系统，实际生产吞吐量无法上升 |
| 前提条件 | ⚠️ 此假设在 H1 技术问题基本解决后才能有效验证——如果系统本身跑不了，无法区分"不能用"和"不想用" |

## Sub-Hypotheses {hyp}

### 8a — 用户未接受培训
终端用户不知道新系统如何使用，或培训材料不匹配实际工作流
✅ | 培训完成率 <30%；用户反馈"不知道怎么用"；培训内容与实际操作步骤不一致 | → A1,4<br>→ A5,6
❌ | 培训完成率 >80% 且用户反馈培训有效 → 不是培训问题 | → A1,4<br>→ A5,6
→ | 检查 Sub-Hypothesis 8b |

### 8b — 缺少变更管理计划
没有正式的切换计划和时间表，用户不知道何时必须切换，旧系统未被关闭
✅ | 无正式的 cutover plan；旧系统仍在运行且无关闭时间表；管理层未发布切换指令 | → A1,2<br>→ A5,7,8
❌ | 有明确的 cutover plan + deadline + 管理层通知 → 不是变更管理问题 | → A1,2<br>→ A5,7,8
→ | 检查 Sub-Hypothesis 8c |

### 8c — 业务流程未适配
新系统的工作流与旧业务流程不兼容，用户被迫绕回旧系统
✅ | 用户访谈显示"新系统缺少我日常需要的某个步骤"；旧流程仍在并行运行且无人迁移 | → A1,3<br>→ A5,9
❌ | 新系统完整覆盖旧业务流程 → 不是流程问题 | → A1,3<br>→ A5,9
→ | 可能是纯粹的习惯阻力，需要管理层强制推动 + Change Champion |

## Discovery — Technical Actions {disc}
| Action 1 | Usage Analytics Baseline — 分析实际登录人数、功能使用率、API 调用量；对比授权用户数 vs 活跃用户数 | ← 8a,8b,8c
| Action 2 | 新旧系统并行使用比例 — 监控旧系统是否仍有活跃流量；如有，占总流量多少？ | ← 8b
| Action 3 | User Journey 分析 — 用户在新系统中的操作路径是否完整？有没有中途退出的断点？ | ← 8c
| Action 4 | 培训完成率数据 — 从 LMS 或培训系统提取完成率、考核通过率、课程覆盖范围 | ← 8a

## Discovery — Process Actions {disc}
| Action 5 | 终端用户访谈（10-15人）— 分层抽样：活跃用户（为什么在用？体验如何？）+ 非活跃用户（为什么不用？什么阻碍了？）+ 管理层（是否知道切换进度？） | ← 8a,8b,8c
| Action 6 | 培训材料审查 — 培训内容是否匹配新系统的实际操作？是否覆盖了关键业务场景？ | ← 8a
| Action 7 | 变更管理计划检查 — 有无正式 cutover plan？旧系统有无关闭时间表？管理层是否发布了切换指令？ | ← 8b
| Action 8 | Change Champion 识别 — 在活跃用户中识别有影响力的人，愿意帮助推动 peer adoption | ← 8b
| Action 9 | 业务流程对比 — 映射旧工作流 vs 新工作流，识别功能 gap 和摩擦点 | ← 8c

## Discovery 产出物 {disc}
| 产出物 | Adoption Gap Report & User Readiness Score — 包含：活跃率基线、培训覆盖度、变更管理成熟度评分、业务流程 gap 清单、Change Champion 候选名单、推荐采用加速计划 |

## 执行计划 {exec}
| Phase 0-1 (Week 1-3) | 仅做 baseline 数据收集（Action 1-4）——此阶段重心在技术修复，采用数据作为 background 积累 |
| Phase 2 (Week 4-7) | 技术修复取得阶段性成果后，启动用户访谈和培训审查（Action 5-9）；产出 Adoption Gap Report |
| Phase 2 后半 (Week 6-7) | 基于 Gap Report 制定采用加速计划：更新培训内容、启动 Change Champion 计划、制定 cutover timeline |
| Phase 3 (Week 8-12) | 执行采用加速计划；监控活跃率周环比增长；Phase 3 末期达成全量生产运行 + Legacy 系统退役就绪 |

## RACI {raci}
| R — Responsible | Outcome CE（采用框架设计）+ Customer Change Management Lead（执行变更管理） |
| A — Accountable | VP of Operations（授权变更管理计划 + 旧系统关闭决策） |
| C — Consulted | Training Partners（培训内容更新）、End Users / BU Leaders（反馈和配合）、Head of Cloud Delivery（技术就绪确认） |
| I — Informed | Google TAM（平台使用情况和技术支持跟踪） |

## 风险与成功标准 {risk}
| 成功标准 | 活跃用户数 / 授权用户数 ≥70%；旧系统流量降至 <10%；新平台承载全量生产负载且 Legacy 进入退役倒计时 |
| 风险 | 技术问题迟迟未解决导致采用工作无法启动；管理层不愿强制推动切换（"让用户自己选"） |
| 风险缓解 | Phase 0-1 先做 baseline 数据收集不占主线资源；提前与 VP 对齐——全量迁移上线和 Legacy 退役是他的核心目标，采用推动需要他的管理权威 |
| Blocker 依赖 | 依赖 H1 全部 Blocker 基本解决——系统必须可用且性能达标才能推动用户采用；与 #4（DBA）间接相关——数据验证完成后数据才可信，用户才愿意切换 |
