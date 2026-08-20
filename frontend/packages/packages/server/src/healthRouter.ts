/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Router, type Request, type Response } from "express";

const router = Router();

const healthHandler = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 200, text: "Health check ok" });
};

router.get("/health", healthHandler);
router.get("/health/liveness", healthHandler);
router.get("/health/readiness", healthHandler);

export const healthRouter = router;
