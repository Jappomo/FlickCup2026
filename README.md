# Baize Cup

Table football in the browser. Pull back and flick your figures with mouse, touch or a controller, using the classic table-football rules: block flicks, three touches per figure, shooting areas, corners, free kicks and throw-ins.

**Play:** `https://<your-username>.github.io/baize-cup/`

## Modes

- **Kick-off**: two players on one screen, or two controllers
- **Versus CPU**
- **Tutorial**: a guided 3v3 covering attack, then defence
- **Practice**: 3v3, kick-off, foul kick, corner, throw-in, rondo and shooting drills
- **Online Friendly**: only in the Claude-hosted version (it needs Claude's shared rooms)

## Run it locally

Browsers block loading models from `file://`, so serve the folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Create an empty repository on GitHub named `baize-cup`.
2. In this folder:
   ```
   git init -b main
   git add -A
   git commit -m "First commit"
   git remote add origin https://github.com/<your-username>/baize-cup.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings > Pages**, set **Source** to *Deploy from a branch*, then pick `main` and `/ (root)`, and save.
4. After a minute or so the game is live at the address above.

## Balancing

The Balancing tab (password `Admin123`) edits what each star and each squad path does, and which Moments each path unlocks. Values save in your browser. **Copy JSON** copies the numbers so you can make them the new defaults (`BAL_DEF` in `index.html`). The password only keeps players out of the sheet by accident; anyone who reads the page source can see it.

## Editing the models

The models in `models/` are plain `.glb` files. Open them in Blender, edit, export back to the same file name, then commit and push.

- `CoP_` objects are the collision shapes the physics uses. Keep their names and sizes.
- `SM_` objects are the visuals. Change them freely.
- Balls: each `SM_Ball_###_Name` object in `ball.glb` becomes a ball in the Customization tab, with `Name` as its label.

## Music

Tracks live in `music/`. The playlist is the `TRACKS` list in `index.html`. Each entry is written `Title + Version - Artist`: the part after `+` is an alternative version and the part after `-` is the singer.
