/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

export const TitleAnnouncer = () => {
  const titleRef = useRef<HTMLParagraphElement | null>(null);
  const [title, setTitle] = useState("");
  const { pathname } = useLocation();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [navigationCount, setNavigationCount] = useState(0);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setTitle("");
    setNavigationCount((count) => count + 1);
  }

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTitle = document.querySelector("title")?.textContent;
      if (newTitle) {
        setTitle(newTitle);
      }
    });

    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!navigationCount || window.location.hash.length) return;
    // Popovers closed by the navigation restore focus to their trigger in an earlier animation frame callback
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [navigationCount]);

  return (
    <Text srOnly aria-live="assertive" tabIndex={-1} id="titleAnnouncer" ref={titleRef}>
      {title}
    </Text>
  );
};
