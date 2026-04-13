---
id: 6
title: Target Region Resources
badge: P0-触发
badge-class: p0
status: Active
status-class: active
subtitle: 诊断当天完成，但 quota 审批 2-4 周 — Day 1 必须提交申请
---

## 基本信息
| 架构图位置 | GKE Compute Pool → Region: Target Data Center |
| 架构图标注 | ⚠️ Resources Unavailable |
| 上下游关系 | **上游:** Dataflow ETL Engine（处理后数据需要 GKE 承载计算）<br>**下游:** BigQuery（计算结果写入） |
| Impact | 无法 scale out，当前计算资源无法支撑生产负载 |
| 假设归属 | H1: 技术与基建 |
| 怀疑方向 | 目标 region 的计算资源不足，可能是 quota 限制、机型无库存、或 autoscaling 配置有问题 |

## Sub-Hypotheses {hyp}

### 6a — Quota 不足
项目在目标 region 的 CPU/GPU quota 低于生产需求
✅ | Quota dashboard 显示已用 quota 接近或达到上限；部署新 node 时返回 quota exceeded 错误 | → A1,5<br>→ A7,9
❌ | Quota 充足（已用 <50% 上限），部署新 node 无 quota 报错 → 不是 quota 问题 | → A1,5<br>→ A7,9
→ | 检查 Sub-Hypothesis 6b |

### 6b — 机型无库存
目标 region 所需的机型（如 n2-standard-32）物理库存不足
✅ | 部署请求返回 ZONE_RESOURCE_POOL_EXHAUSTED 错误；GCP Status Dashboard 显示该 region 容量受限 | → A2,5,6<br>→ A8,9
❌ | 目标机型在所有 zone 均可部署 → 不是库存问题 | → A2,5,6<br>→ A8,9
→ | 检查 Sub-Hypothesis 6c |

### 6c — Autoscaling 配置不当
资源实际可用，但 GKE autoscaler 配置了过低的 maxNodeCount 或错误的 scaling policy
✅ | Autoscaler 日志显示达到 maxNodeCount 上限拒绝扩容；或 scale-up 延迟过长（>10min） | → A3,4,5
❌ | Autoscaler 配置合理、扩容正常触发 → 不是配置问题 | → A3,4,5
→ | 资源问题可能是复合因素（quota + 配置），需综合分析 |

## Discovery — Technical Actions {disc}
| Action 1 | Quota Dashboard 检查 — `gcloud compute regions describe [REGION]` 查看各资源类型 quota 使用率 | ← 6a
| Action 2 | 机型可用性测试 — 在目标 region 每个 zone 尝试创建目标机型实例，记录哪些 zone 可用、哪些返回 EXHAUSTED | ← 6b
| Action 3 | GKE Autoscaler 审计 — 检查 cluster autoscaler 配置：minNodeCount, maxNodeCount, scaling policy；查看 autoscaler events 日志 | ← 6c
| Action 4 | Node Pool 配置审查 — 检查当前 node pool 的机型选择、preemptible/spot 比例、multi-zone 配置 | ← 6c
| Action 5 | 容量需求测算 — 基于全量生产负载反推所需的计算资源量（vCPU/RAM/Disk），对比当前配置 | ← 6a,6b,6c
| Action 6 | 备选 Region 延迟测试 — 如果目标 region 确认容量不足，测试候选 region 到 on-prem 和终端用户的网络延迟 | ← 6b

## Discovery — Process Actions {disc}
| Action 7 | 确认 Quota 申请流程和审批人 — Quota increase request 走什么渠道？审批周期多长？能否加急？ | ← 6a
| Action 8 | 确认数据驻留/合规要求 — 切换 region 是否有数据驻留法规限制？需要与安全/合规团队确认 | ← 6b
| Action 9 | 与 Google TAM/Support 确认容量预留 — 能否为该项目做 capacity reservation？预留的前置时间多长？ | ← 6a,6b

## Discovery 产出物 {disc}
| 产出物 | Region & Capacity Assessment Report — 包含：quota 使用现状、机型可用性矩阵（region × zone × 机型）、autoscaler 配置审计结果、备选 region 评估、推荐路径 |

## 执行计划 {exec}
| Phase 0 (Week 1-2) | 完成 Action 1-9；产出 Assessment Report；Week 1 内做出关键决策：留在当前 region（申请 quota + 预留容量）还是切换 region |
| Phase 1 (Week 2-3) | **若留当前 region：**提交 quota increase + capacity reservation request；调整 autoscaler 配置；优化 node pool（换更小机型增加数量/加 spot instances）<br>**若切换 region：**迁移 GKE cluster 配置到新 region；重新部署 workload；验证网络延迟可接受 |
| Phase 2 (Week 4-7) | 资源就绪后，配合 Pipeline（Blocker #5）做负载扩展测试；逐步 scale up 到生产规模 |
| Phase 3 (Week 8-12) | 生产稳定运行；优化资源利用率（right-sizing）；建立容量监控和预警 |

## RACI {raci}
| R — Responsible | Outcome CE（评估 + 方案建议） |
| A — Accountable | Head of Cloud Delivery（region 选择决策） |
| C — Consulted | Network Engineering（延迟影响评估）、Security/Compliance（数据驻留）、Google Support/TAM（容量预留） |
| I — Informed | VP of Operations |

## 风险与成功标准 {risk}
| 成功标准 | 计算资源可按需扩展至生产规模（无 quota/库存阻断）；autoscaling 在负载变化时 5 分钟内响应；资源利用率 60-80% |
| 风险 | Quota increase 审批周期不可控（可能 2-4 周）；切换 region 引入额外网络延迟和数据迁移成本 |
| 风险缓解 | 两条路并行推进——同时申请 quota 和评估备选 region，Week 2 根据进展选择快的那条；通过 Google TAM 加速 quota 审批 |
| Blocker 依赖 | 与 #5（Pipeline Latency）强耦合——Pipeline 修复后需要足够的计算资源才能扩大吞吐量；与 #1（Interconnect）间接相关——切换 region 可能影响 Interconnect 路由<br>**⚠️ 伪依赖提示：**资源诊断（quota 检查、机型测试、autoscaler 审计）独立于 Pipeline 修复，Day 1 即可并行启动 |
