/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Outlet } from "react-router";
import config from "../../../config";
import { NotFoundPage } from "../../NotFoundPage/NotFoundPage";

const QuizFeatureGate = () => {
  if (!config.enableQuiz) return <NotFoundPage />;

  return <Outlet />;
};

export default QuizFeatureGate;
