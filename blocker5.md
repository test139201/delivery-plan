---
id: 5
title: Data Pipeline Latency
badge: P0-短线
badge-class: p0
status: Active
status-class: active
subtitle: 技术不确定性最高 — 子集数据 Day 1 profiling，不等带宽修复
---

## 基本信息
| 架构图位置 | Dataflow ETL Engine → Data Processing 节点 |
| 架构图标注 | ⚠️ Latency Bug |
| 上下游关系 | **上游:** On-Prem ETL Engine → Dedicated Interconnect → Cloud Storage<br>**下游:** GKE Compute Pool → BigQuery |
| Impact | 无法承受生产负载，直接导致数据处理吞吐量不达标 |
| 假设归属 | H1: 技术与基建 |
| 怀疑方向 | ETL 代码从 on-prem 迁移到 Dataflow 后未做云原生适配，或者延迟源不在代码本身而在上游网络/下游存储 |

## Sub-Hypotheses {hyp}

### 5a — 代码层
ETL 逻辑未优化 — on-prem ETL 代码直接搬到 Dataflow，未利用 Dataflow 的并行处理能力，存在资源锁争用或低效序列化
✅ | Profiling 显示单个 stage 耗时异常；存在热点函数；shuffle 数据量远超输入数据量；序列化/反序列化占比 >30% | → A1,2,3,4,6<br>→ A7,9,10
❌ | 代码在隔离环境（小数据集 + 充足资源）性能达标，延迟随数据量/并发线性增长而非指数增长 → 代码本身没问题，瓶颈在外部 | → A1,2,3,4,6<br>→ A7,9,10
→ | 检查 Sub-Hypothesis 5b |

### 5b — 上游瓶颈
延迟源在网络传输层 — Interconnect 带宽不足导致数据进入 Cloud Storage 就已经慢了，Pipeline 只是"放大"了上游延迟
✅ | Cloud Storage 写入延迟与 Interconnect 传输延迟高度相关；Pipeline 等待数据输入的时间占总延迟的大部分 | → A2,5
❌ | Cloud Storage 中的数据已就绪（无等待），Pipeline 处理阶段才出现延迟 → 问题在 Pipeline 内部，不在上游 | → A2,5
→ | 检查 Sub-Hypothesis 5c |

### 5c — 架构层
Dataflow pipeline 设计不适配 — 不是代码写得差，而是架构选型有问题（如 batch vs streaming 选错，partitioning 策略不当，数据 skew 未处理）
✅ | Dataflow job graph 显示严重的 data skew（部分 worker 负载是其他的 10x+）；batch window 设置与数据到达模式不匹配 | → A1,2,4,6<br>→ A8,10
❌ | 数据分布均匀、架构选型合理、job graph 无异常 → 需要看下游或整体链路 | → A1,2,4,6<br>→ A8,10
→ | 延迟可能是多层叠加的复合问题，需要端到端 Trace 分析 |

## Discovery — Technical Actions {disc}
| Action 1 | Dataflow Job Profiling — 查看 job execution graph，识别最慢的 stage；检查每个 stage 的输入输出数据量比；识别 data skew（worker 间负载是否均衡） | ← 5a,5c
| Action 2 | Cloud Trace 端到端延迟分解 — 从数据进入 Cloud Storage 到写入 BigQuery 的完整链路，按层标注每段耗时：Ingestion → Processing → Transform → Load | ← 5a,5b,5c
| Action 3 | Cloud Profiler 代码级分析 — 识别 CPU 热点函数、内存分配模式、锁争用；对比 on-prem ETL 的关键代码路径 | ← 5a
| Action 4 | Shuffle 和序列化分析 — 检查 Dataflow shuffle 数据量是否异常（shuffle bytes vs input bytes ratio）；检查序列化框架选择（Avro/Protobuf/JSON） | ← 5a,5c
| Action 5 | Cloud Storage I/O 分析 — 检查 source bucket 的读取延迟和吞吐量；确认是否因文件过大/过小导致 I/O 效率低 | ← 5b
| Action 6 | On-Prem ETL 基准对比 — 用相同数据集在 on-prem ETL 跑一次，记录处理时间，作为 Dataflow 的性能对比基线 | ← 5a,5c

## Discovery — Process Actions {disc}
| Action 7 | 确认 Pipeline 代码维护责任人 — 这段代码是谁写的？迁移到 Dataflow 时谁做的适配？目前谁有能力改？ | ← 5a
| Action 8 | 获取原始 Pipeline 设计文档 — 找 Pre-sales CE 拿最初的 pipeline 架构设计 + 审批文档，对比当前实际运行状态是否有 drift | ← 5c
| Action 9 | 确认 Code Review 流程 — 代码变更是否有 review 机制？还是直接部署？有无 CI/CD pipeline？ | ← 5a
| Action 10 | 评估开发团队 Dataflow 经验 — 团队是否接受过 Dataflow 培训？是否是第一次用？是否需要 Google Specialist CE 支持？ | ← 5a,5c

## Discovery 产出物 {disc}
| 产出物 | Pipeline Performance Diagnostic Report — 包含：端到端延迟分解图、每个 stage 的耗时和数据量、确认/排除的 sub-hypothesis、推荐修复路径 |

## 执行计划 {exec}
| Phase 0 (Week 1-2) | 完成 Action 1-10；产出 Diagnostic Report；确认根因属于 5a/5b/5c 中的哪一个（或复合问题） |
| Phase 1 (Week 2-3) | **若 5a 确认（代码层）：**优化热点代码 + 调整序列化方式 + 回归测试<br>**若 5b 确认（上游网络）：**与 Blocker #1 联动修复 Interconnect，Pipeline 延迟将随网络改善而下降<br>**若 5c 确认（架构层）：**重新设计 partitioning 策略 / 调整 batch window / 处理 data skew — ⚠️ 此路径耗时最长，可能延伸至 Phase 2 |
| Phase 2 (Week 4-7) | Pipeline 修复后，逐步扩大数据处理量：10% → 30% → 60% → 100%；每级观察延迟和错误率 |
| Phase 3 (Week 8-12) | 全量生产负载稳定运行；性能调优（单位数据处理效率）；编写 Pipeline Runbook |

## RACI {raci}
| R — Responsible | Outcome CE（诊断 + 调优指导）+ Partner/Customer Dev Team（代码修改） |
| A — Accountable | Head of Cloud Delivery（Pipeline 性能目标） |
| C — Consulted | Pre-sales CE（原始设计意图）、Google Support/TAM（Dataflow 产品问题） |
| I — Informed | VP of Operations（进展通报） |

## 风险与成功标准 {risk}
| 成功标准 | Pipeline 在生产数据量下端到端延迟 ≤ SLA 要求；能持续处理全量生产负载对应的数据吞吐量；无需人工干预 |
| 风险 | 根因诊断可能需要多轮迭代（代码改了发现还是慢→再查架构）；开发团队可能缺 Dataflow 经验导致修复周期拉长 |
| 风险缓解 | Week 1 就请 Google Specialist CE 介入；如果 Week 3 代码修复无明显改善，立即升级为架构重设计方案 |
| Blocker 依赖 | Blocker #1（Interconnect）带宽修复可能同步改善 Pipeline 延迟（Sub-Hyp 5b）；Blocker #6（Region）需要 Pipeline 修复后配合扩展<br>**⚠️ 伪依赖提示：**Pipeline profiling 不需要全量带宽——子集数据即可 Day 1 启动诊断，不必等 #1 修复 |
