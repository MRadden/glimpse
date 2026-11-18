# Glimpse (prototype)

Share a private, read-only glimpse of your social media feed with someone you care about.

## How it works
1. The owner downloads their own data from TikTok, YouTube (Google Takeout) or Instagram.
2. The app reads the ZIP file **on the device** and builds an interest map and a feed.
3. The owner hides any topic, creator or post.
4. The app makes a share link. The data is inside the link (after `#`), so no server is needed.
5. The viewer scrolls the feed for 5, 15 or 30 minutes, reacts to posts, and gets a recap.

## Commands
```bash
npm install      # install libraries
npm run dev      # start the app at http://localhost:5173
npm test         # run the parser and share-link tests
npm run build    # make a production build in dist/
```

## Where things are
- `src/parsers/` — readers for each platform's export
- `src/lib/topics.ts` — topic dictionary (keywords → topics)
- `src/lib/score.ts` — interest scores and feed selection
- `src/share/codec.ts` — packs a snapshot into a link
- `src/routes/` — the screens
- `src/demo/personas.ts` — sample people for the demo
