import { defineStore } from 'pinia';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

export interface TagView extends Partial<RouteLocationNormalizedLoaded> {
  title?: string;
}

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViews: [] as TagView[],
    cachedViews: [] as string[],
  }),
  actions: {
    addView(view: TagView) {
      this.addVisitedView(view);
      this.addCachedView(view);
    },
    addVisitedView(view: TagView) {
      if (this.visitedViews.some((v) => v.path === view.path)) return;
      this.visitedViews.push(
        Object.assign({}, view, {
          title: view.meta?.title || 'no-name',
        }),
      );
    },
    addCachedView(view: TagView) {
      if (typeof view.name === 'string' && view.name) {
        if (this.cachedViews.includes(view.name)) return;
        if (!view.meta?.noCache) {
          this.cachedViews.push(view.name);
        }
      }
    },
    delView(view: TagView) {
      return new Promise((resolve) => {
        this.delVisitedView(view);
        this.delCachedView(view);
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews],
        });
      });
    },
    delVisitedView(view: TagView) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.path === view.path) {
          this.visitedViews.splice(i, 1);
          break;
        }
      }
    },
    delCachedView(view: TagView) {
      if (typeof view.name === 'string') {
        const index = this.cachedViews.indexOf(view.name);
        if (index > -1) {
          this.cachedViews.splice(index, 1);
        }
      }
    },
    delOthersViews(view: TagView) {
      this.visitedViews = this.visitedViews.filter((v) => {
        return v.meta?.affix || v.path === view.path;
      });
      if (typeof view.name === 'string') {
        const index = this.cachedViews.indexOf(view.name);
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(index, index + 1);
        } else {
          this.cachedViews = [];
        }
      }
    },
    delAllViews() {
      this.visitedViews = this.visitedViews.filter((tag) => tag.meta?.affix);
      this.cachedViews = [];
    },
  },
});
