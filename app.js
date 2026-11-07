(() => {
  "use strict";

  const guide = document.getElementById("guide");
  const form = document.getElementById("ask");
  const input = document.getElementById("q");
  const askBtn = document.getElementById("ask-btn");
  const status = document.getElementById("status");
  const wrap = document.getElementById("answer-wrap");
  const answer = document.getElementById("answer");
  const related = document.getElementById("related");

  const RULES =
    "You are the help desk for a dog-care guide. Answer only from the guide text you are given. " +
    "When the guide covers the question, answer it and stop. Only when it does not, say so in one sentence " +
    "and suggest asking a vet. Plain language, under 120 words, no headings or lists.";

  const MESSAGES = {
    no_key: "No key is configured on this page.",
    quota_exceeded: "This demo has used up its token allowance. Get your own key at onetagai.com to keep going.",
    paused: "OneTag AI is paused for today. Try again after 00:00 UTC.",
    rate_limited: "Too many questions in one minute. Give it a moment and try again.",
    too_large: "That question is too long for one call.",
    network: "Could not reach OneTag AI. Check your connection and try again.",
    upstream: "The AI provider had a problem. Try again in a few seconds.",
    aborted: "Stopped.",
  };

  let history = [];
  let controller = null;

  const entries = () =>
    Array.from(guide.querySelectorAll(".entry")).map((el) => ({
      id: el.id,
      question: el.querySelector("h3").textContent,
    }));

  function clearHits() {
    guide.querySelectorAll(".entry.hit").forEach((el) => el.classList.remove("hit"));
  }

  function showRelated(ids) {
    clearHits();
    related.textContent = "";
    const valid = ids.filter((id) => typeof id === "string" && document.getElementById(id));
    if (!valid.length) return;
    related.append("From the guide: ");
    for (const id of valid) {
      const el = document.getElementById(id);
      el.classList.add("hit");
      const a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = el.querySelector("h3").textContent;
      related.append(a);
    }
  }

  function fail(e) {
    const code = e && e.code;
    status.textContent = MESSAGES[code] || (e && e.message) || "Something went wrong.";
    status.classList.add("error");
  }

  async function ask(question) {
    if (controller) controller.abort();
    controller = new AbortController();
    const { signal } = controller;

    askBtn.disabled = true;
    status.classList.remove("error");
    status.textContent = "Reading the guide…";
    wrap.hidden = false;
    answer.textContent = "";
    related.textContent = "";
    clearHits();

    let started = false;
    // The language rule travels with the question itself: the model follows it there more
    // reliably than in the system text.
    const answerCall = onetag.ask(question + "\n\n(Reply in the same language as the question above.)", guide, {
      system: RULES,
      history,
      maxTokens: 300,
      signal,
      stream: (delta) => {
        if (!started) {
          started = true;
          status.textContent = "";
        }
        answer.textContent += delta;
      },
    });
    const relatedCall = onetag.ask(
      'Which entries in this list best answer the question "' + question.replace(/"/g, "'") +
        '"? Return {"ids": [...]} with up to 3 ids, best first, or an empty list if none fit.',
      entries(),
      { json: true, maxTokens: 60, signal }
    );

    const [a, r] = await Promise.allSettled([answerCall, relatedCall]);
    if (signal.aborted) return;
    askBtn.disabled = false;

    if (a.status === "fulfilled") {
      status.textContent = "";
      history.push({ role: "user", content: question }, { role: "assistant", content: a.value });
      if (history.length > 8) history = history.slice(-8);
      input.placeholder = "Ask a follow-up";
    } else {
      fail(a.reason);
    }
    if (r.status === "fulfilled" && r.value && Array.isArray(r.value.ids)) showRelated(r.value.ids);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });

  document.querySelectorAll(".chips button").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = "";
      ask(btn.dataset.q);
    });
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (controller) controller.abort();
    history = [];
    wrap.hidden = true;
    answer.textContent = "";
    related.textContent = "";
    status.textContent = "";
    status.classList.remove("error");
    clearHits();
    input.placeholder = "Why does my puppy bite my hands?";
    askBtn.disabled = false;
    input.focus();
  });
})();
