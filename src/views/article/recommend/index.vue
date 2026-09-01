<template>
  <div class="recommend-control-container p-4 space-y-4">
    <!-- 顶部状态与策略选择卡片 -->
    <el-card shadow="never" class="!border-gray-200/80 dark:!border-gray-800 rounded-xl bg-white dark:bg-dark-900">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- 左侧：标题与激活状态 -->
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-gray-900 dark:text-gray-100">
                文章推荐算法控制中心
              </h2>
              <el-tag type="success" size="small" effect="plain" class="rounded-md">
                实时沙盘就绪
              </el-tag>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">
              当前全局生效策略：
              <span class="font-semibold text-primary">
                {{ activeStrategy?.name || '综合多因子平衡推荐' }}
              </span>
              （{{ activeStrategy?.algorithmType || 'HYBRID' }} 模型）
            </p>
          </div>
        </div>

        <!-- 右侧：策略切换与操作按钮组 -->
        <div class="flex items-center flex-wrap gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">选择策略：</span>
          <el-select
            v-model="selectedStrategyId"
            placeholder="切换配置策略"
            class="w-56"
            @change="handleStrategyChange"
          >
            <el-option
              v-for="item in strategyList"
              :key="item.id"
              :label="item.name + (item.isDefault === 1 ? ' (当前全局激活)' : '')"
              :value="item.id"
            />
          </el-select>

          <el-button
            v-if="currentStrategy?.isDefault !== 1"
            type="success"
            plain
            icon="Check"
            v-hasPermi="['article:recommend:update']"
            @click="handleSetAsDefault"
          >
            设为全局生效
          </el-button>

          <el-button
            type="primary"
            icon="DocumentChecked"
            :loading="saveLoading"
            v-hasPermi="['article:recommend:update']"
            @click="handleSaveStrategy"
          >
            保存策略
          </el-button>

          <el-button
            icon="Plus"
            v-hasPermi="['article:recommend:config']"
            @click="handleOpenNewStrategyDialog"
          >
            新建策略
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主 Tab 切换：沙盘调优 vs 单篇干预管理 -->
    <el-tabs v-model="activeTab" type="card" class="bg-white dark:bg-dark-900 px-4 pt-3 rounded-xl border border-gray-200/80 dark:border-gray-800">
      <!-- TAB 1: 算法策略调优与沙盘试算 -->
      <el-tab-pane label="算法策略调优与实时沙盘" name="sandbox">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
          <!-- 左侧：参数调优面板 (5 列) -->
          <div class="lg:col-span-5 space-y-4">
            <!-- 预设模板卡片组 -->
            <div class="bg-gray-50/80 dark:bg-dark-800/50 p-4 rounded-xl border border-gray-200/60 dark:border-gray-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300">快速应用算法预设模板</span>
                <span class="text-[11px] text-gray-400">点击自动填充因子参数</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="tpl in presetTemplates"
                  :key="tpl.type"
                  class="p-2.5 rounded-lg border bg-white dark:bg-dark-900 cursor-pointer hover:border-primary transition-all text-left group"
                  :class="currentPreset === tpl.type ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200/80 dark:border-gray-700'"
                  @click="applyPresetTemplate(tpl)"
                >
                  <div class="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary">
                    <el-icon :size="14" class="text-primary"><component :is="tpl.iconComponent" /></el-icon>
                    <span>{{ tpl.name }}</span>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1 line-clamp-1">{{ tpl.desc }}</p>
                </div>
              </div>
            </div>

            <!-- 参数滑块控制分组 -->
            <el-form label-position="top" class="space-y-4">
              <!-- 1. 基础互动权重因子 -->
              <el-collapse v-model="activeCollapse" class="custom-collapse">
                <el-collapse-item name="interaction">
                  <template #title>
                    <div class="flex items-center gap-2">
                      <el-icon class="text-primary"><Histogram /></el-icon>
                      <span>互动权重因子 (Engagement Weights)</span>
                    </div>
                  </template>
                  <div class="space-y-3 px-1 pt-1">
                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>浏览量权重 (View Weight)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.viewWeight }}</span>
                      </div>
                      <el-slider v-model="weights.viewWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>

                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>点赞数权重 (Like Weight)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.likeWeight }}</span>
                      </div>
                      <el-slider v-model="weights.likeWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>

                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>评论数权重 (Comment Weight)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.commentWeight }}</span>
                      </div>
                      <el-slider v-model="weights.commentWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>
                  </div>
                </el-collapse-item>

                <!-- 2. 时效衰减与半衰期 -->
                <el-collapse-item name="decay">
                  <template #title>
                    <div class="flex items-center gap-2">
                      <el-icon class="text-primary"><Timer /></el-icon>
                      <span>时效重力衰减 (Time Decay & Gravity)</span>
                    </div>
                  </template>
                  <div class="space-y-3 px-1 pt-1">
                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>半衰期重力指数 Gravity (衰减速度)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.timeDecayRate }}</span>
                      </div>
                      <el-slider
                        v-model="weights.timeDecayRate"
                        :min="0.2"
                        :max="3.0"
                        :step="0.1"
                        @change="triggerSimulate"
                      />
                      <div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>0.2 (极缓衰减/常青文)</span>
                        <span>1.5 (均衡)</span>
                        <span>3.0 (极速衰减/即时热点)</span>
                      </div>
                    </div>
                  </div>
                </el-collapse-item>

                <!-- 3. 内容与标签相关度 -->
                <el-collapse-item name="relevance">
                  <template #title>
                    <div class="flex items-center gap-2">
                      <el-icon class="text-primary"><Aim /></el-icon>
                      <span>分类与标签协同相关度 (Relevance)</span>
                    </div>
                  </template>
                  <div class="space-y-3 px-1 pt-1">
                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>技术分类匹配度权重 (Category Match)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.categoryMatchWeight }}</span>
                      </div>
                      <el-slider v-model="weights.categoryMatchWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>

                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>标签重合匹配度权重 (Tag Match)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.tagMatchWeight }}</span>
                      </div>
                      <el-slider v-model="weights.tagMatchWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>
                  </div>
                </el-collapse-item>

                <!-- 4. 人工提权与新文冷启动扶持 -->
                <el-collapse-item name="coldstart">
                  <template #title>
                    <div class="flex items-center gap-2">
                      <el-icon class="text-primary"><Opportunity /></el-icon>
                      <span>人工置顶提权 & 新文冷启动扶持 (Cold Start & Ops)</span>
                    </div>
                  </template>
                  <div class="space-y-3 px-1 pt-1">
                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>人工推荐提权倍数加成 (Manual Boost)</span>
                        <span class="font-mono font-bold text-primary">{{ weights.manualBoostWeight }}</span>
                      </div>
                      <el-slider v-model="weights.manualBoostWeight" :min="0" :max="100" @change="triggerSimulate" />
                    </div>

                    <div class="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">开启新文章冷启动保量扶持</span>
                        <el-switch v-model="coldStartConfig.enableColdStart" @change="triggerSimulate" />
                      </div>

                      <template v-if="coldStartConfig.enableColdStart">
                        <div>
                          <div class="flex justify-between text-xs text-gray-500 mb-1">
                            <span>冷启动扶持周期</span>
                            <span class="font-mono font-bold text-primary">{{ coldStartConfig.boostDays }} 天</span>
                          </div>
                          <el-slider v-model="coldStartConfig.boostDays" :min="1" :max="30" @change="triggerSimulate" />
                        </div>

                        <div>
                          <div class="flex justify-between text-xs text-gray-500 mb-1">
                            <span>初始最高扶持倍率</span>
                            <span class="font-mono font-bold text-primary">{{ coldStartConfig.boostScoreMultiplier }}x</span>
                          </div>
                          <el-slider
                            v-model="coldStartConfig.boostScoreMultiplier"
                            :min="1.0"
                            :max="3.0"
                            :step="0.1"
                            @change="triggerSimulate"
                          />
                        </div>

                        <div>
                          <div class="flex justify-between text-xs text-gray-500 mb-1">
                            <span>曝光保量阈值 (低于此阅读量享受全额扶持)</span>
                            <span class="font-mono font-bold text-primary">{{ coldStartConfig.minImpressionsThreshold }} 次</span>
                          </div>
                          <el-slider
                            v-model="coldStartConfig.minImpressionsThreshold"
                            :min="50"
                            :max="1000"
                            :step="50"
                            @change="triggerSimulate"
                          />
                        </div>
                      </template>
                    </div>
                  </div>
                </el-collapse-item>

                <!-- 5. 多样性打散与探索 -->
                <el-collapse-item name="diversity">
                  <template #title>
                    <div class="flex items-center gap-2">
                      <el-icon class="text-primary"><Grid /></el-icon>
                      <span>多样性打散与探索率 (Diversity & Explore)</span>
                    </div>
                  </template>
                  <div class="space-y-3 px-1 pt-1">
                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>同一分类最大连续推荐上限 (打散度)</span>
                        <span class="font-mono font-bold text-primary">{{ diversityConfig.maxPerCategory }} 篇</span>
                      </div>
                      <el-slider v-model="diversityConfig.maxPerCategory" :min="1" :max="10" @change="triggerSimulate" />
                    </div>

                    <div>
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>随机探索比率 (Epsilon-Greedy 随机池)</span>
                        <span class="font-mono font-bold text-primary">{{ Math.round(diversityConfig.exploreRate * 100) }}%</span>
                      </div>
                      <el-slider
                        :model-value="diversityConfig.exploreRate * 100"
                        :min="0"
                        :max="30"
                        @update:model-value="(val: any) => { diversityConfig.exploreRate = Number(val) / 100; triggerSimulate(); }"
                      />
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </el-form>
          </div>

          <!-- 右侧：实时沙盘排序与得分明细 (7 列) -->
          <div class="lg:col-span-7 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50/90 dark:bg-dark-800/60 rounded-xl border border-gray-200/60 dark:border-gray-800">
              <div class="flex items-center gap-2">
                <el-icon class="text-primary"><DataAnalysis /></el-icon>
                <span class="text-xs font-bold text-gray-800 dark:text-gray-200">
                  推荐候选文章实时试算排序
                </span>
                <span class="text-xs text-gray-400">
                  (候选池 {{ simulateResult.totalCandidates }} 篇，展示 Top {{ simulateResult.recommendedCount }})
                </span>
              </div>
              <div class="flex items-center gap-2">
                <el-button size="small" icon="Refresh" :loading="simulateLoading" @click="triggerSimulate">
                  重新试算
                </el-button>
              </div>
            </div>

            <!-- 试算结果列表卡片 -->
            <div v-loading="simulateLoading" class="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              <div
                v-for="item in simulateResult.simulatedList"
                :key="item.id"
                class="bg-white dark:bg-dark-900 p-3.5 rounded-xl border border-gray-200/70 dark:border-gray-800 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <!-- 左侧：排名序号、封面与标题 -->
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <!-- 排名徽章 -->
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    :class="getRankBadgeClass(item.simulatedRank || 0)"
                  >
                    #{{ item.simulatedRank }}
                  </div>

                  <!-- 排名变动指示 -->
                  <div class="flex-shrink-0 w-8 text-center text-xs font-bold">
                    <span v-if="(item.rankDelta || 0) > 0" class="text-emerald-500">
                      ↑{{ item.rankDelta }}
                    </span>
                    <span v-else-if="(item.rankDelta || 0) < 0" class="text-rose-500">
                      ↓{{ Math.abs(item.rankDelta || 0) }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-gray-600">-</span>
                  </div>

                  <!-- 文章封面 -->
                  <el-image
                    v-if="item.coverImage"
                    :src="item.coverImage"
                    class="w-14 h-10 rounded object-cover flex-shrink-0 border dark:border-gray-700 hidden sm:block"
                  />

                  <!-- 文章标题与元数据 -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <el-tag v-if="item.isTop === 1" size="small" type="danger" effect="dark">置顶</el-tag>
                      <el-tag v-if="item.isRecommend === 1" size="small" type="warning" effect="plain">精选推荐</el-tag>
                      <el-tag v-if="item.recommendWeight" size="small" type="primary" effect="light">
                        干预 {{ item.recommendWeight > 0 ? '+' : '' }}{{ item.recommendWeight }}
                      </el-tag>
                      <span class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {{ item.title }}
                      </span>
                    </div>

                    <div class="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                      <span>分类: {{ item.categoryName }}</span>
                      <span>作者: {{ item.authorName }}</span>
                      <span class="inline-flex items-center gap-0.5"><el-icon><View /></el-icon> {{ item.viewCount }}</span>
                      <span class="inline-flex items-center gap-0.5"><el-icon><Pointer /></el-icon> {{ item.likeCount }}</span>
                    </div>
                  </div>
                </div>

                <!-- 右侧：得分拆解与干预操作 -->
                <div class="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                  <!-- 得分拆解 Tag / Tooltip -->
                  <el-tooltip placement="top" :show-after="100">
                    <template #content>
                      <div class="text-xs space-y-1 py-1">
                        <div class="font-bold text-amber-300">推荐得分组成拆解：</div>
                        <div>· 互动基础分：{{ item.scoreBreakdown.interactionScore }} (阅:{{ item.scoreBreakdown.viewComponent }} + 赞:{{ item.scoreBreakdown.likeComponent }})</div>
                        <div>· 时效衰减率：{{ item.scoreBreakdown.timeDecayFactor }}x (发布 {{ item.scoreBreakdown.hoursSincePublish }} 小时)</div>
                        <div>· 冷启动增益：{{ item.scoreBreakdown.coldStartMultiplier }}x {{ item.scoreBreakdown.isColdStartApplied ? '(扶持中)' : '' }}</div>
                        <div>· 运营提权分：{{ item.scoreBreakdown.manualBoostScore }}</div>
                        <div>· 相关度加成：{{ item.scoreBreakdown.relevanceScore }}</div>
                        <div class="pt-1 border-t border-gray-600 font-bold">综合总得分：{{ item.scoreBreakdown.finalScore }}</div>
                      </div>
                    </template>
                    <div class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs cursor-pointer flex items-center gap-1 border border-amber-200/60 dark:border-amber-900/50">
                      <span>{{ item.scoreBreakdown.finalScore }}</span>
                      <span class="text-[10px] opacity-75">分</span>
                    </div>
                  </el-tooltip>

                  <!-- 快速干预按钮 -->
                  <el-button
                    link
                    type="primary"
                    size="small"
                    icon="EditPen"
                    v-hasPermi="['article:recommend:control']"
                    @click="handleQuickControl(item)"
                  >
                    干预
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- TAB 2: 文章推荐干预管理列表 -->
      <el-tab-pane label="文章推荐干预列表" name="override">
        <div class="py-2">
          <ProTable
            ref="overrideTableRef"
            table-key="art_recommend_override_list"
            :columns="overrideColumns"
            :request-api="getArticleList"
            :init-param="{ status: 2 }"
          >
            <!-- 标题列 -->
            <template #title="{ row }">
              <div class="flex items-center gap-2">
                <el-image
                  v-if="row.coverImage"
                  :src="row.coverImage"
                  class="w-10 h-7 rounded object-cover flex-shrink-0 border"
                />
                <span class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ row.title }}</span>
              </div>
            </template>

            <!-- 推荐模式列 -->
            <template #recommendFactor="{ row }">
              <el-tag v-if="row.recommendFactor === 1" type="success" size="small">强制强推</el-tag>
              <el-tag v-else-if="row.recommendFactor === 2" type="danger" size="small">算法屏蔽/禁推</el-tag>
              <el-tag v-else-if="row.recommendFactor === 3" type="warning" size="small">强制冷启动</el-tag>
              <el-tag v-else type="info" size="small">自然算法流</el-tag>
            </template>

            <!-- 干预权重列 -->
            <template #recommendWeight="{ row }">
              <span
                class="font-mono font-bold"
                :class="(row.recommendWeight || 0) > 0 ? 'text-emerald-600' : (row.recommendWeight || 0) < 0 ? 'text-rose-600' : 'text-gray-400'"
              >
                {{ (row.recommendWeight || 0) > 0 ? '+' : '' }}{{ row.recommendWeight || 0 }}
              </span>
            </template>

            <!-- 操作列 -->
            <template #action="{ row }">
              <el-button
                link
                type="primary"
                icon="Setting"
                v-hasPermi="['article:recommend:control']"
                @click="handleQuickControl(row)"
              >
                配置推荐干预
              </el-button>
            </template>
          </ProTable>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 单篇文章推荐干预设置弹窗 -->
    <el-dialog
      v-model="controlDialogVisible"
      title="单篇文章推荐算法干预"
      width="480px"
      destroy-on-close
    >
      <el-form :model="controlForm" label-position="top" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-dark-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-300">
          <span class="font-bold block text-gray-800 dark:text-gray-100 mb-1">正在干预文章：</span>
          <span class="line-clamp-1">{{ selectedArticle?.title }}</span>
        </div>

        <el-form-item label="干预模式">
          <el-radio-group v-model="controlForm.recommendFactor" class="w-full">
            <el-radio-button :value="0">自然算法流</el-radio-button>
            <el-radio-button :value="1">强制强推</el-radio-button>
            <el-radio-button :value="2">算法屏蔽(禁推)</el-radio-button>
            <el-radio-button :value="3">强制冷启动</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="推荐权重分值微调 (-100 ~ +100)">
          <div class="w-full space-y-1">
            <div class="flex justify-between text-xs text-gray-400">
              <span>负值降权</span>
              <span class="font-mono font-bold text-primary">{{ controlForm.recommendWeight }} 分</span>
              <span>正值提权</span>
            </div>
            <el-slider
              v-model="controlForm.recommendWeight"
              :min="-100"
              :max="100"
              :step="5"
              show-stops
            />
          </div>
        </el-form-item>

        <el-form-item label="编辑精选标记 (isRecommend)">
          <el-switch v-model="controlForm.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="推荐干预有效截止时间 (留空表示永久有效)">
          <el-date-picker
            v-model="controlForm.recommendExpireAt"
            type="datetime"
            placeholder="选择截止时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="controlDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="controlSaveLoading" @click="handleSaveArticleControl">
            保存干预配置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建策略弹窗 -->
    <el-dialog
      v-model="newStrategyDialogVisible"
      title="新建推荐算法策略"
      width="460px"
      destroy-on-close
    >
      <el-form ref="newStrategyFormRef" :model="newStrategyForm" :rules="newStrategyRules" label-position="top">
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="newStrategyForm.name" placeholder="例如：周末热点资讯模型" />
        </el-form-item>

        <el-form-item label="策略唯一标识编码" prop="ruleCode">
          <el-input v-model="newStrategyForm.ruleCode" placeholder="例如：WEEKEND_TRENDING" />
        </el-form-item>

        <el-form-item label="算法核心类型">
          <el-select v-model="newStrategyForm.algorithmType" class="w-full">
            <el-option label="HYBRID (多因子加权综合模型)" value="HYBRID" />
            <el-option label="HOT_DECAY (时效重力衰减模型)" value="HOT_DECAY" />
            <el-option label="COLD_START (冷启动探索扶持模型)" value="COLD_START" />
            <el-option label="CONTENT_BASED (内容标签协同模型)" value="CONTENT_BASED" />
          </el-select>
        </el-form-item>

        <el-form-item label="策略描述说明">
          <el-input v-model="newStrategyForm.description" type="textarea" :rows="2" placeholder="填写策略适用场景..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="newStrategyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateStrategy">创建策略</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash-es';
import {
  TrendCharts,
  Check,
  DocumentChecked,
  Plus,
  Histogram,
  Timer,
  Aim,
  Opportunity,
  Grid,
  Refresh,
  EditPen,
  Setting,
  View,
  Pointer,
  ScaleToOriginal,
  ChatDotRound,
  DataAnalysis,
} from '@element-plus/icons-vue';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import { getArticleList } from '@/api/article/post';
import {
  getAllRecommendRules,
  getActiveRecommendRule,
  createRecommendRule,
  updateRecommendRule,
  setActiveRecommendRule,
  simulateRecommend,
  updateArticleRecommendControl,
} from '@/api/article/recommend';
import type {
  RecommendRuleEntity,
  RecommendWeightsConfig,
  ColdStartConfig,
  DiversityConfig,
  RecommendedArticleItem,
  ArticleEntity,
} from '@/types/article';

const activeTab = ref('sandbox');
const activeCollapse = ref(['interaction', 'decay', 'relevance', 'coldstart']);
const strategyList = ref<RecommendRuleEntity[]>([]);
const activeStrategy = ref<RecommendRuleEntity | null>(null);
const currentStrategy = ref<RecommendRuleEntity | null>(null);
const selectedStrategyId = ref<number | undefined>(undefined);
const saveLoading = ref(false);
const simulateLoading = ref(false);

const currentPreset = ref<string>('HYBRID');

// 参数对象
const weights = reactive<RecommendWeightsConfig>({
  viewWeight: 20,
  likeWeight: 40,
  commentWeight: 30,
  timeDecayRate: 1.5,
  tagMatchWeight: 35,
  categoryMatchWeight: 30,
  manualBoostWeight: 50,
});

const coldStartConfig = reactive<ColdStartConfig>({
  enableColdStart: true,
  boostDays: 7,
  boostScoreMultiplier: 1.6,
  minImpressionsThreshold: 200,
});

const diversityConfig = reactive<DiversityConfig>({
  maxPerCategory: 3,
  exploreRate: 0.1,
  dedupHistoryDays: 7,
});

// 沙盘试算结果
const simulateResult = reactive({
  totalCandidates: 0,
  recommendedCount: 0,
  simulatedList: [] as RecommendedArticleItem[],
});

// 预设模板（使用 Element Plus 图标组件）
const presetTemplates = [
  {
    type: 'HYBRID',
    name: '综合多因子平衡',
    iconComponent: ScaleToOriginal,
    desc: '全能平衡各维度指标',
    weights: { viewWeight: 20, likeWeight: 40, commentWeight: 30, timeDecayRate: 1.5, tagMatchWeight: 35, categoryMatchWeight: 30, manualBoostWeight: 50 },
    coldStart: { enableColdStart: true, boostDays: 7, boostScoreMultiplier: 1.6, minImpressionsThreshold: 200 },
  },
  {
    type: 'HOT_DECAY',
    name: '热门时效衰减',
    iconComponent: Timer,
    desc: 'Hacker News 重力衰减',
    weights: { viewWeight: 15, likeWeight: 50, commentWeight: 35, timeDecayRate: 1.8, tagMatchWeight: 10, categoryMatchWeight: 10, manualBoostWeight: 30 },
    coldStart: { enableColdStart: false, boostDays: 3, boostScoreMultiplier: 1.2, minImpressionsThreshold: 50 },
  },
  {
    type: 'COLD_START',
    name: '新文冷启动保量',
    iconComponent: Opportunity,
    desc: '扶持新发布优质作品',
    weights: { viewWeight: 20, likeWeight: 30, commentWeight: 20, timeDecayRate: 1.0, tagMatchWeight: 40, categoryMatchWeight: 40, manualBoostWeight: 40 },
    coldStart: { enableColdStart: true, boostDays: 14, boostScoreMultiplier: 2.2, minImpressionsThreshold: 500 },
  },
  {
    type: 'DEEP_ENGAGEMENT',
    name: '深度互动高粘性',
    iconComponent: ChatDotRound,
    desc: '高权重评论与干货标签',
    weights: { viewWeight: 10, likeWeight: 35, commentWeight: 55, timeDecayRate: 1.2, tagMatchWeight: 45, categoryMatchWeight: 35, manualBoostWeight: 40 },
    coldStart: { enableColdStart: true, boostDays: 10, boostScoreMultiplier: 1.4, minImpressionsThreshold: 200 },
  },
];

// 单篇干预弹窗状态
const controlDialogVisible = ref(false);
const controlSaveLoading = ref(false);
const selectedArticle = ref<any>(null);
const controlForm = reactive({
  recommendFactor: 0,
  recommendWeight: 0,
  isRecommend: 0,
  recommendExpireAt: '' as string | null,
});

// 新建策略弹窗状态
const newStrategyDialogVisible = ref(false);
const newStrategyFormRef = ref();
const newStrategyForm = reactive({
  name: '',
  ruleCode: '',
  algorithmType: 'HYBRID',
  description: '',
});
const newStrategyRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '请输入策略编码', trigger: 'blur' }],
};

// 单篇干预表格列定义
const overrideColumns: ColumnProps[] = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'title', label: '文章标题', minWidth: 260, slot: 'title' },
  { prop: 'categoryName', label: '分类', width: 120, align: 'center' },
  { prop: 'authorName', label: '作者', width: 100, align: 'center' },
  { prop: 'recommendFactor', label: '干预模式', width: 140, slot: 'recommendFactor', align: 'center' },
  { prop: 'recommendWeight', label: '权重微调分', width: 110, slot: 'recommendWeight', align: 'center' },
  { prop: 'isRecommend', label: '精选推荐', width: 90, align: 'center' },
  { prop: 'viewCount', label: '阅读量', width: 90, align: 'center' },
  { prop: 'likeCount', label: '点赞数', width: 90, align: 'center' },
  { prop: 'publishedAt', label: '发布时间', width: 170, align: 'center' },
  { prop: 'action', label: '操作', width: 140, slot: 'action', align: 'center', fixed: 'right' },
];

const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return 'bg-amber-400 text-white shadow-sm';
  if (rank === 2) return 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
  if (rank === 3) return 'bg-amber-700/80 text-white';
  return 'bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400';
};

// 触发沙盘即时试算 (防抖 200ms)
const triggerSimulate = debounce(async () => {
  simulateLoading.value = true;
  try {
    const res = await simulateRecommend({
      weights: { ...weights },
      coldStartConfig: { ...coldStartConfig },
      diversityConfig: { ...diversityConfig },
      limit: 20,
    });
    simulateResult.totalCandidates = res.totalCandidates;
    simulateResult.recommendedCount = res.recommendedCount;
    simulateResult.simulatedList = res.simulatedList;
  } finally {
    simulateLoading.value = false;
  }
}, 200);

// 加载全部策略列表
const loadStrategies = async () => {
  const [list, active] = await Promise.all([
    getAllRecommendRules(),
    getActiveRecommendRule(),
  ]);
  strategyList.value = list || [];
  activeStrategy.value = active;

  if (active && !selectedStrategyId.value) {
    selectedStrategyId.value = active.id;
    currentStrategy.value = active;
    syncStrategyParams(active);
  } else if (strategyList.value.length > 0 && !selectedStrategyId.value) {
    const first = strategyList.value[0];
    selectedStrategyId.value = first.id;
    currentStrategy.value = first;
    syncStrategyParams(first);
  }

  triggerSimulate();
};

const syncStrategyParams = (rule: RecommendRuleEntity) => {
  if (rule.weights) Object.assign(weights, rule.weights);
  if (rule.coldStartConfig) Object.assign(coldStartConfig, rule.coldStartConfig);
  if (rule.diversityConfig) Object.assign(diversityConfig, rule.diversityConfig);
};

const handleStrategyChange = (id: number) => {
  const target = strategyList.value.find((s) => s.id === id);
  if (target) {
    currentStrategy.value = target;
    syncStrategyParams(target);
    triggerSimulate();
  }
};

const applyPresetTemplate = (tpl: any) => {
  currentPreset.value = tpl.type;
  Object.assign(weights, tpl.weights);
  Object.assign(coldStartConfig, tpl.coldStart);
  ElMessage.info(`已应用预设：${tpl.name}`);
  triggerSimulate();
};

const handleSaveStrategy = async () => {
  if (!currentStrategy.value) return;
  saveLoading.value = true;
  try {
    await updateRecommendRule(currentStrategy.value.id, {
      weights: { ...weights },
      coldStartConfig: { ...coldStartConfig },
      diversityConfig: { ...diversityConfig },
    });
    ElMessage.success('推荐策略参数已成功保存');
    await loadStrategies();
  } finally {
    saveLoading.value = false;
  }
};

const handleSetAsDefault = async () => {
  if (!currentStrategy.value) return;
  ElMessageBox.confirm(
    `确定将策略 "${currentStrategy.value.name}" 设为全站全局默认激活策略吗？`,
    '激活确认',
    { type: 'warning' },
  ).then(async () => {
    await setActiveRecommendRule(currentStrategy.value!.id);
    ElMessage.success('已切换为全局默认激活策略');
    await loadStrategies();
  });
};

const handleOpenNewStrategyDialog = () => {
  newStrategyForm.name = '';
  newStrategyForm.ruleCode = `CUSTOM_${Date.now().toString().slice(-4)}`;
  newStrategyForm.algorithmType = 'HYBRID';
  newStrategyForm.description = '';
  newStrategyDialogVisible.value = true;
};

const handleCreateStrategy = async () => {
  await newStrategyFormRef.value.validate();
  await createRecommendRule({
    name: newStrategyForm.name,
    ruleCode: newStrategyForm.ruleCode,
    algorithmType: newStrategyForm.algorithmType,
    description: newStrategyForm.description,
    weights: { ...weights },
    coldStartConfig: { ...coldStartConfig },
    diversityConfig: { ...diversityConfig },
    status: 1,
    isDefault: 0,
  });
  ElMessage.success('新建推荐策略成功');
  newStrategyDialogVisible.value = false;
  await loadStrategies();
};

// 单篇干预弹窗
const handleQuickControl = (article: ArticleEntity | RecommendedArticleItem) => {
  selectedArticle.value = article;
  controlForm.recommendFactor = article.recommendFactor ?? 0;
  controlForm.recommendWeight = article.recommendWeight ?? 0;
  controlForm.isRecommend = article.isRecommend ?? 0;
  controlForm.recommendExpireAt = (article.recommendExpireAt as string) || null;
  controlDialogVisible.value = true;
};

const handleSaveArticleControl = async () => {
  if (!selectedArticle.value) return;
  controlSaveLoading.value = true;
  try {
    await updateArticleRecommendControl(selectedArticle.value.id, {
      recommendFactor: controlForm.recommendFactor,
      recommendWeight: controlForm.recommendWeight,
      isRecommend: controlForm.isRecommend,
      recommendExpireAt: controlForm.recommendExpireAt || null,
    });
    ElMessage.success('单篇文章推荐干预已更新');
    controlDialogVisible.value = false;
    triggerSimulate();
  } finally {
    controlSaveLoading.value = false;
  }
};

onMounted(() => {
  loadStrategies();
});
</script>

<style scoped>
:deep(.custom-collapse .el-collapse-item__header) {
  font-weight: 600;
  font-size: 13px;
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
}
</style>
