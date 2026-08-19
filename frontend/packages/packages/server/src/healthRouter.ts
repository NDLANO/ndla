/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Router, type Request, type Response } from "express";

interface HealthRouter {
  router: Router;
  getIsShuttingDown: () => boolean;
  setIsShuttingDown: () => void;
}

const createHealthRouter = (): HealthRouter => {
  let isShuttingDown = false;

  const router = Router();
  const livenessHandler = (_req: Request, res: Response): void => {
    res.status(200).json({ status: 200, text: "Health check ok" });
  };

  router.get("/health", livenessHandler);
  router.get("/health/liveness", livenessHandler);
  router.get("/health/readiness", (_req: Request, res: Response): void => {
    if (isShuttingDown) {
      res.status(500).json({ status: 500, text: "Service shutting down" });
    } else {
      res.status(200).json({ status: 200, text: "Health check ok" });
    }
  });

  return {
    router,
    getIsShuttingDown: (): boolean => isShuttingDown,
    setIsShuttingDown: (): void => {
      isShuttingDown = true;
    },
  };
};

const defaultHealthRouter = createHealthRouter();

export const healthRouter = defaultHealthRouter.router;
export const getIsShuttingDown = defaultHealthRouter.getIsShuttingDown;
export const setIsShuttingDown = defaultHealthRouter.setIsShuttingDown;
