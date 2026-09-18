// Fallback entrypoint for Vercel Node runtime detection
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', name: 'Anak Pintar' });
}
