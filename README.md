# Sit. Stay. Ask.

A dog-care guide for new owners that answers questions about itself. Twenty-five entries on feeding, health, training, daily life and emergencies, and a question box that answers only from those entries, in whatever language you ask.

Live: https://fengyiqicoder.github.io/onetag-ai-testing/

## How it works

It is a static page with no backend. One script tag loads [OneTag AI](https://onetagai.com/?ref=onetag-ai-testing); the page passes the guide element and the visitor's question to `onetag.ask`, streams the answer into the page, and asks a second time for the three most relevant entries as JSON so it can link to them.

```html
<script src="https://onetagai.com/v1.js" data-key="YOUR_ONETAG_KEY"></script>
<script type="module">
  const guide = document.querySelector("#guide");
  const answer = await onetag.ask(question, guide, {
    system: "Answer only from the guide. If it is not covered, say so.",
    history,                                   // earlier turns, for follow-ups
    stream: (delta) => { out.textContent += delta; },
  });
</script>
```

The key in `index.html` is public by design; every key has a token allowance. Get your own at [onetagai.com](https://onetagai.com/?ref=onetag-ai-testing), or with one request (the key arrives in that inbox):

```bash
curl -X POST https://onetagai.com/api/signup -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
```

## Files

- `index.html`: the guide and the question box
- `app.js`: the two `onetag.ask` calls, history for follow-ups, error messages
- `style.css`: styling

The guide is general advice for healthy pet dogs, not veterinary advice.
