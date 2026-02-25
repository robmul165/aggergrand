# CHANGELOG
2/16/2026 2:10pm lunarsouls added CHANGELOG.md for project change tracking. 

2/19/2026 3:38pm lunarsouls created vs workspace save for local editing and retention of extensions and settings in vscode. Checking for any python extensions/ vs code updates none as of now.

2/19/2026 3:55pm lunarsouls added to index.html 

2/19/2026 4:34pm lunarsouls updated homepage navigation card layout by nesting Digital Tools image and label inside one anchor in index.html and added matching .grid-item.with-image, .grid-item-image, and .grid-item-label styling in css/style.css so the image sits directly above the button text as one connected clickable tile.

2/19/2026 4:42pm lunarsouls added granular GitHub-style diff details for the Digital Tools image/button card update.

index.html
```diff
-    <a href="digitalTools.html" class="grid-item">Digital Tools</a>
+    <a href="digitalTools.html" class="grid-item with-image">
+      <img src="images/math.jpg" alt="Digital tools" class="grid-item-image">
+      <span class="grid-item-label">Digital Tools</span>
+    </a>
```

css/style.css
```diff
-.grid.item.with-image {
+.grid-item.with-image {
   padding: 0;
   overflow: hidden;
   display: flex;
   flex-direction: column;
   align-items: stretch;
   justify-content: flex-start;
 }
 
 .grid-item-image {
   width: 100%;
-  max-width: 220px;
   height: 120px;
   object-fit: cover;
   display: block;
 }
 
+.grid-item-label {
+  display: block;
+  padding: 24px 20px;
+  text-align: center;
+  font-size: 1.2rem;
+  font-weight: bold;
+  color: #333;
+}
```

2/24/2026 5:44pm lunarsouls updated homepage SEO items across the main page: improved title and H1 keyword targeting, added meta description, canonical tag, Open Graph metadata, structured data, image dimension/format optimization, and expanded on-page copy. Twitter Card metadata was intentionally not added because there is no active Twitter/X usage at this time.
