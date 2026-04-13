---
id: 1
title: Interconnect Bandwidth Throttled
badge: P0-长线
badge-class: p0
status: Active
status-class: active
subtitle: 运营商响应 2-4 周 — Pipeline 测试不需要全量带宽
---

## 基本信息
| 架构图位置 | Dedicated Interconnect → Connectivity（On-Prem 到 GCP 之间的物理链路） |
| 架构图标注 | ⚠️ Throttled Connection |
| 上下游关系 | **上游:** On-Prem Source（2PB Raw Data）<br>**下游:** Cloud Storage（数据落地）→ Dataflow Pipeline |
| Impact | 数据传输速度受限，直接拖慢 2PB 数据迁移进度，间接影响 Pipeline 吞吐量 |
| 假设归属 | H1: 技术与基建 |
| 怀疑方向 | Interconnect 实际吞吐量低于合同承诺，可能是物理链路配置、运营商限速、或 GCP 侧 attachment 配置不匹配 |

## Sub-Hypotheses {hyp}

### 1a — On-Prem 路由器配置
MTU mismatch 导致分片开销；单 BGP session 无法 ECMP 负载均衡；路由策略限制
✅ | traceroute 显示 on-prem 侧跳数异常或延迟集中在出口路由器；MTU 测试显示 fragmentation；BGP 只有单 session | → A1,2,3,4<br>→ A9,10
❌ | On-prem 路由器配置正确，MTU 一致，ECMP 已启用 → 问题不在客户侧 | → A1,2,3,4<br>→ A9,10
→ | 检查 Sub-Hypothesis 1b |

### 1b — 运营商限速
Carrier 有 rate-limiting policy 压低吞吐量，实际可用带宽低于合同购买的物理带宽
✅ | iperf3 测试持续达到一个固定上限（远低于物理带宽），且上限不随时间变化（典型限速特征） | → A1,2<br>→ A7,8,10
❌ | 吞吐量随负载变化自然波动，无人为上限 → 运营商未限速 | → A1,2<br>→ A7,8,10
→ | 检查 Sub-Hypothesis 1c |

### 1c — GCP Attachment 配置
如 100G 物理端口上只配了单个 10G attachment，或 VLAN 配置错误
✅ | `gcloud compute interconnects describe` 显示 attachment bandwidth < 物理电路 bandwidth；VLAN tag 不匹配 | → A1,5,6<br>→ A10
❌ | Attachment 配置与物理电路匹配，VLAN 正常 → 问题不在 GCP 侧 | → A1,5,6<br>→ A10
→ | 可能是复合问题（多层叠加），需要逐段对比排查 |

## Discovery — Technical Actions {disc}
| Action 1 | iperf3 端到端吞吐量测试 — 从 on-prem 到 GCP VM（同 region），测峰值和持续吞吐量，对比合同带宽 | ← 1a,1b,1c
| Action 2 | traceroute / mtr 延迟分层 — 定位延迟集中在哪一跳：on-prem 出口？运营商骨干？GCP 入口？ | ← 1a,1b
| Action 3 | MTU 端到端测试 — `ping -M do -s 1472` 测试路径 MTU 是否一致，是否存在 fragmentation | ← 1a
| Action 4 | BGP Session 检查 — 确认 BGP session 数量、是否启用 ECMP、路由条目是否正确 | ← 1a
| Action 5 | GCP Interconnect Metrics — Cloud Monitoring 查看 interconnect attachment 的利用率、丢包率、错误计数 | ← 1c
| Action 6 | `gcloud compute interconnects describe` — 检查 attachment bandwidth、VLAN 配置、link 状态 | ← 1c

## Discovery — Process Actions {disc}
| Action 7 | 调取 Interconnect 合同 — 确认合同承诺的带宽（如 10G/100G）、SLA 条款、超额使用条款 | ← 1b
| Action 8 | 联系运营商 — 确认是否有 rate-limiting policy；请求提供运营商侧的链路利用率数据 | ← 1b
| Action 9 | 确认 Network Engineering 联系人 — 客户侧谁管 on-prem 路由器和 Interconnect？能否在 Week 1 安排联合诊断 session？ | ← 1a
| Action 10 | 确认变更审批流程 — 如果需要修改路由器配置或升级带宽，变更审批要走什么流程？周期多长？ | ← 1a,1b,1c

## Discovery 产出物 {disc}
| 产出物 | Network Performance Baseline Report — 包含：端到端吞吐量基线、逐跳延迟分解、MTU/BGP 配置状态、确认/排除的 sub-hypothesis、推荐修复路径及预计周期 |

## 执行计划 {exec}
| Phase 0 (Week 1-2) | 完成 Action 1-10；产出 Baseline Report；确认根因在 1a/1b/1c 中的哪一个 |
| Phase 1 (Week 2-3) | **若 1a 确认（On-Prem 配置）：**修复 MTU / 启用 ECMP / 优化路由策略 — 客户 Network Eng 执行，CE 指导<br>**若 1b 确认（运营商限速）：**联系运营商取消限速或升级套餐 — ⚠️ 运营商响应周期不可控，同时启动 VPN backup 方案<br>**若 1c 确认（GCP Attachment）：**调整 attachment 配置或增加 attachment 数量 — Google TAM/Support 协助 |
| Phase 2 (Week 4-7) | 带宽修复后，配合数据迁移计划逐步提升传输量；监控吞吐量和丢包率 |
| Phase 3 (Week 8-12) | 2PB 数据传输完成；建立网络性能监控 dashboard 和告警 |

## RACI {raci}
| R — Responsible | Outcome CE（诊断指导）+ Customer Network Engineering（执行配置变更） |
| A — Accountable | Head of Cloud Delivery（网络性能目标） |
| C — Consulted | 运营商技术支持、Google TAM/Support（Interconnect SLA + Attachment 配置） |
| I — Informed | VP of Operations、Pre-sales CE（原始网络设计上下文） |

## 风险与成功标准 {risk}
| 成功标准 | 端到端吞吐量达到合同带宽的 ≥80%；数据传输速度可支撑 90 天内完成 2PB 迁移；延迟和丢包在 SLA 内 |
| 风险 | 运营商升级/取消限速可能需要 2-4 周；物理带宽升级可能需要硬件采购（更长） |
| 风险缓解 | Phase 0 就启动运营商沟通；同时准备 VPN backup 方案作为临时带宽补充；与 #6 联动——如切换 region 则 Interconnect 路由也需重新评估 |
| Blocker 依赖 | #5（Pipeline Latency）的 Sub-Hyp 5b 就是"上游网络慢"——如果 #1 修复，#5 的延迟可能同步改善；#6（Region）——切换 region 可能需要新的 Interconnect 路由<br>**⚠️ 伪依赖提示：**#5 Pipeline profiling 不需要等全量带宽，子集数据即可独立诊断 |
