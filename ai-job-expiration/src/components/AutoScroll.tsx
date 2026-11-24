import React from "react";
import { APP, VIEW } from "../theme";
import { ChatMessage } from "./ChatMessage";
import { rowsAt, scrollAt } from "./layout";

/**
 * The message area. Only messages that have been sent or answered so far exist in it — nothing later is ever
 * laid out. When a new bubble does not fit, the conversation glides up so that the newest one stays above the
 * input bar.
 */
export const AutoScroll: React.FC<{ g: number }> = ({ g }) => {
  const { rows } = rowsAt(g);
  const scroll = scrollAt(g);
  return (
    <div style={{ position: "absolute", left: 0, top: VIEW.top, width: APP.w, height: VIEW.h + 40, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: APP.w, transform: `translateY(${-scroll}px)` }}>
        {rows.map((r) => <ChatMessage key={`${r.m.id}-${r.kind}`} row={r} g={g} scroll={scroll} />)}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: APP.w, height: 26, background: "linear-gradient(180deg, rgba(10,10,15,0.95), rgba(10,10,15,0))" }} />
    </div>
  );
};
