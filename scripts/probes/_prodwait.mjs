const URL = "https://portfolio-jet-eta-24.vercel.app/work/badante24h";
for (let i = 0; i < 30; i++) {
  try {
    const r = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    const t = await r.text();
    if (t.includes("Detail 01")) { console.log("DEPLOYED after", i * 15, "s"); process.exit(0); }
    if (t.includes("Security Checkpoint") || r.status === 403) { console.log("CHECKPOINT", r.status); process.exit(2); }
    console.log(i, r.status, "not yet");
  } catch (e) { console.log(i, "err", e.message); }
  await new Promise((res) => setTimeout(res, 15000));
}
console.log("TIMEOUT");
process.exit(1);
