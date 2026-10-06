# Previs Studio: UX research (2026-10-06)

Scope: how storyboard, animatic, video-review and audio tools let a non-expert see, choose, comment and approve, to design "Previs Studio" (the owner's request, 2026-10-06). Depth: standard, one session, about 21 searches and page reads, no sub-agents. Neutral: this reports what the sources describe and how strong that sourcing is; the design choices at the end are proposals, marked as such.

## Evidence table

| # | Claim | Sources | Independent | Primary? | Agreement | Strength | Strongest source |
|---|---|---|---|---|---|---|---|
| 1 | Storyboard tools pair a panel grid with a one-click animatic view of the same panels | Boords help, Storyboarder reviews, StudioBinder pages, Krock animatic page | 4 vendors / reviewers | Vendor docs | Agree | Strong | [1] Boords help |
| 2 | Panels carry fixed text fields (Action, Sound/dialogue, Camera, Notes), toggleable or custom | Boords help, StudioBinder, Storyboarder reviews | 3 | Vendor docs + reviews | Agree | Strong | [1] |
| 3 | A duration per panel is what turns boards into a timed animatic | Storyboarder reviews, Boords animatic | 2 | Secondary + vendor | Agree | Moderate | [3] |
| 4 | Reviewers click on the frame during playback to leave a comment anchored to a spot and a time | Frame.io help, Vimeo blog, Dropbox Replay pages, fast.io | 4 | Vendor docs | Agree | Strong | [5] Frame.io help |
| 5 | Drawing on the frame (arrow, line, box, free draw) is standard in review tools; Vimeo Review lacks it | Frame.io help, SyncSketch support, Krock, review of Vimeo | 4 | Vendor docs + review | Agree | Strong | [5] |
| 6 | Range comments by dragging handles or with I/O keys | Frame.io help (V4) | 1 | Vendor docs | n/a | Single source | [5] |
| 7 | Comment markers sit on the progress bar; clicking a comment jumps to its time | Frame.io help, Vimeo blog | 2 | Vendor docs | Agree | Moderate | [5] |
| 8 | Commenting works in fullscreen | Frame.io help, Frame.io V4 blog | 1 vendor (2 pages) | Vendor | n/a | Single vendor | [5] |
| 9 | Compare views use side-by-side with linked playback, plus an A/B toggle hotkey | Frame.io comparison viewer, SyncSketch compare, Dropbox Replay | 3 | Vendor docs | Agree | Strong | [8] |
| 10 | Hold or toggle a key to see the alternative (before/after) | Lightroom tutorials (backslash) | Several tutorials, one product | Secondary | Agree | Moderate | [11] |
| 11 | Step-by-step wizards help novices and rare tasks, but annoy repeat or expert users | NN/g, LogRocket | 2 | NN/g is research-based | Agree | Strong | [9] NN/g |
| 12 | Progressive disclosure: show the frequent features first, at most two levels | NN/g | 1 | Research-based | n/a | Strong single authority | [10] NN/g |
| 13 | Music is best judged against your own video (Soundmatch plays your video to suggest tracks; Canva swaps music in place) | Epidemic Sound press, Canva help | 2 | Vendor + trade press | Agree | Moderate | [13] |
| 14 | Timed comments on a waveform (click below it, or pause and type) | SoundCloud help, BandLab blog | 2 | Vendor docs | Agree | Strong | [15] |
| 15 | Beat markers drawn on the waveform; cuts snap to them | CapCut guides (third party) | Several, one product | Secondary | Agree | Moderate | [18] |
| 16 | Auto-ducking lowers music under dialogue and shows it as keyframes | Premiere guides, Frame.io Insider, Epidemic "ducking mix" | 3 | Mixed | Agree | Strong | [19] |
| 17 | Music can be fitted to the video length (remix / adapt length) | Premiere AI remix, Epidemic adapt length | 2 | Vendor | Agree | Moderate | [13] |
| 18 | Music stems (melody, instruments, bass, drums) let you thin a track | Epidemic Sound | 1 | Vendor | n/a | Single source | [13] |
| 19 | Edit by text: change the script, the media follows; ask the AI in plain words | Descript site and help | 1 vendor | Vendor | n/a | Single vendor | [21] |
| 20 | Audio-focused review needs a waveform; Frame.io reviews call its audio review limited | Pibox, Notetracks, reviews | 3 (competitors) | Competitor marketing | Agree | Weak to moderate (interested parties) | [22] |
| 21 | AI storyboard tools split script into scenes and shots and track recurring elements across shots | LTX Studio reviews and site | 2 | Vendor + reviews | Agree | Moderate | [4] |

Strength describes the sourcing, not whether the pattern is right for us.

## Summary of what the sources show
- **Storyboard ⇄ animatic is one object with two views.** Boords, StudioBinder, Storyboarder and Krock all keep panels (with fixed text fields and a duration each) and play the same panels as a timed animatic [1][2][3][7].
- **Review is spatial and temporal.** Frame.io, Dropbox Replay, SyncSketch and Krock let you click a spot on the frame, draw on it, select a range, and see every note as a marker on the bar [5][6][16][7]. Vimeo Review is the counterexample: timecoded but text-only [12].
- **Choosing works best in context and side by side.** Compare viewers link playback [8][16]; photo tools use a hold-key before/after [11]; music services test tracks against your own video [13][14].
- **Novices need a path, experts need freedom.** Wizards help rare tasks and novices but frustrate repeat use [9]; progressive disclosure caps at two levels [10].
- **Audio has its own grammar.** Waveform-timed comments [15], beat markers and snapping [18], visible ducking [19], fit-to-length [13][20], and stems [13].

## 25 patterns for Previs Studio
Each: what · where seen · why it helps a non-expert · how we would use it (proposal).

**Storyboard and playback**
1. **One film, two views: Storyboard and Play.** Boords' Animatic button, Storyboarder [1][3]. Panels are scannable at a glance; Play shows timing. Proposal: a toggle at the top; both read the same data.
2. **Fixed panel fields.** Shot number, frame, duration, Action, Sound (voice line), Camera; Notes on demand. Boords, StudioBinder [1][2]. Familiar from every storyboard. Proposal: those six, with "More" for music and SFX detail.
3. **Duration on every panel and a total runtime.** Storyboarder [3]. Makes pacing visible without playing.
4. **Click a panel to play from it.** Common to board-to-animatic tools [1][7]. Proposal: clicking a panel jumps Play to that shot.
5. **Elements named across shots.** LTX Studio "Elements" [4]. Lets a comment say "Receipt total" instead of "#stage .f-tot". Proposal: every commentable element gets a plain name in the data.

**Commenting**
6. **Click the frame to comment.** Frame.io anchored comments, Vimeo, Replay [5][12][6]. No form to fill in: the place and time are captured by the click.
7. **Draw on the frame.** Arrow, line, box, free draw [5][16]. Shows what words can't.
8. **Range comments.** Drag handles or I/O keys [5]. For "this whole section is slow".
9. **Markers on the bar, list linked to the bar.** [5][12]. Shows where feedback clusters.
10. **Next and previous comment buttons.** Implied by list navigation [5][12]. Proposal: explicit buttons and N/Shift+N.
11. **Open → Changed states.** Krock, Frame.io [7][5]. the owner sees what Claude has addressed.
12. **Comment in fullscreen.** Frame.io [5][17]. Review stays immersive.

**Choosing between options**
13. **Try the option in place.** Soundmatch, Canva [13][14]. A choice is only judgeable in context. Proposal: clicking an option jumps 1.5 s before its moment and plays through it with sound.
14. **A/B toggle and hold-to-compare.** SyncSketch hotkey, Lightroom backslash [16][11]. Instant comparison without losing your place. Proposal: hold a key to swap to the other option while held.
15. **Side-by-side with linked playback.** Frame.io compare, Replay [8][6]. Proposal: optional "Compare A and B" for visual choices (direction, transition).
16. **Guided review as an option, not a cage.** NN/g [9]. "Review all" walks every choice in story order with Back/Next and ends at Approve; free browsing stays available.
17. **Two levels only.** NN/g [10]. Level 1: Play, Storyboard, Choose, Comment, Approve. Level 2: Details (data, engine, files).

**Sound**
18. **Lanes with waveforms: Voice, Music, SFX.** SoundCloud, Pibox, Notetracks [15][22]. Non-experts can see where a sound is.
19. **Click a lane to comment on that sound.** SoundCloud, BandLab [15]. The note targets music or the SFX at that time without menus.
20. **Beat dots on the music lane; the drop marked.** CapCut [18]. Shows why a cut lands where it does.
21. **Show the duck.** Premiere auto-ducking keyframes [19]. The music lane dips visibly under each voice line; a switch turns it off to compare.
22. **Music fitted to the film's length.** Premiere remix, Epidemic adapt length [19][13]. Each music option states that it ends on the last frame.
23. **Thinner or fuller music via stems.** Epidemic stems [13]. Only for beds that ship stems; our CC0 beds do not, so this stays an option for later.
24. **Quick reactions for sound.** Emoji reactions exist in Frame.io [5]; proposal (not seen as such in sources): one-tap chips on a sound, such as "too loud", "too early", "doesn't fit", "want silence", which become notes.
25. **Edit the script line, hear new reads.** Descript text-based editing [21]. Proposal: editing a voice line in a panel queues new Sarah takes for the next version.

## Anti-patterns (seen or reported)
- Text-only comments with no way to point (Vimeo Review's reported gap) [12].
- More than two levels of disclosure [10].
- A wizard forced on repeat users [9].
- Audio review without a waveform (the reported Frame.io audio limitation) [22].
- Every option for the whole film shown at once (our own v0.1 dogfood, not an external source).
- Choosing music or sound out of context (supported by Soundmatch's premise [13]; an inference, not a measured result).

## Constraints that shape the build (from our platform, not the sources)
- Artifact pages cannot use the microphone or camera, so no voice-note comments (Pibox-style audio comments are not possible here).
- Sound plays only after a click; muted autoplay is fine.
- Fullscreen works from a click in desktop browsers; phones may lack it, so the player also has a "theater" mode.

## Conflicts and open questions
- Guided review vs free review: NN/g supports wizards for rare tasks, and previs review is rare per film but repeated across films. Proposed answer: guided is a button, never the only way.
- Drawing vs pins: sources describe both as standard; no usability data on which non-experts prefer. Proposed: pins by default, drawing as one more tool.

## Method and coverage
Searched and read: Boords, StudioBinder, Storyboarder, LTX Studio, Krock, Frame.io (help: commenting, comparison viewer; V4 blogs), Dropbox Replay, SyncSketch, Vimeo Review, NN/g (wizards, progressive disclosure), Lightroom tutorials, Canva help, Epidemic Sound (press and site), SoundCloud, BandLab, Premiere audio guides, CapCut guides, Descript, Pibox/Notetracks. Not covered: Katalist, Previs Pro, Plot, Milanote, Figma variants, Rive, Jitter internals beyond its site, Kitsu/ftrack, Filestage, Loom; no usability studies with numbers. Several sources are vendors describing their own features (good for what exists, weak for what works best).

## Sources (retrieved 2026-10-06)
1. [Boords: Adding notes to frames](https://help.boords.com/en/articles/3430147-adding-notes-to-frames) · [The basics of storyboarding](https://help.boords.com/en/articles/3119282-the-basics-of-storyboarding)
2. [StudioBinder: Online storyboard creator](https://www.studiobinder.com/online-storyboard-creator/) · [Storyboard animatic template](https://www.studiobinder.com/templates/storyboards/storyboard-animatic-template/)
3. [Review: Storyboarder by Wonder Unit (2017)](https://www.animationandvideo.com/2017/10/review-storyboarder-free-storyboarding.html) · [Storyboarder file format](https://github.com/wonderunit/storyboarder/wiki/Storyboarder-File-Format)
4. [LTX Studio review 2026 (Luma Labs)](https://lumalabs.ai/news/ltx-studio-review) · [LTX AI storyboard generator](https://ltx.io/studio/platform/ai-storyboard-generator)
5. [Frame.io: Commenting on your media](https://help.frame.io/en/articles/9105251-commenting-on-your-media)
6. [Dropbox: 6 ways Replay saves editors time](https://www.dropbox.com/resources/replay-saves-video-editors-time)
7. [Krock.io: Animatic maker](https://krock.io/animatic/) · [Krock vs Frame.io](https://krock.io/blog/krock-vs-frame/)
8. [Frame.io: Comparison viewer](https://help.frame.io/en/articles/9952618-comparison-viewer)
9. [NN/g: Wizards](https://www.nngroup.com/articles/wizards/) · [LogRocket: setup wizards](https://blog.logrocket.com/ux-design/creating-setup-wizard-when-you-shouldnt/)
10. [NN/g: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
11. [Fstoppers: Lightroom before/after key](https://fstoppers.com/originals/simple-lightroom-trick-beforeafter-preview-key-344164)
12. [Vimeo: simplified Vimeo Review](https://vimeo.com/blog/post/simplified-vimeo-review) · [playpause.io: time-coded annotations](https://playpause.io/timecoded)
13. [Music Business Worldwide: Epidemic Sound Soundmatch](https://www.musicbusinessworldwide.com/epidemic-sound-unveils-soundmatch-ai-powered-music-discovery-tool-for-videos/) · [Camera Lab: Epidemic Sound review (stems, ducking mix, adapt length)](https://cameralab.net/epidemic-sound-review)
14. [Canva: Create and edit videos](https://www.canva.com/help/creating-and-editing-videos/)
15. [SoundCloud: Commenting basics](https://help.soundcloud.com/hc/en-us/articles/115003566008-Commenting-Basics) · [BandLab: comment timestamps](https://blog.bandlab.com/bandlab-new-features-october-2018-better-ig-sharing-comment-timestamps-all-new-effects-midi-instruments-and-loops/)
16. [SyncSketch: Compare items](https://support.syncsketch.com/hc/en-us/articles/32393992531092-Compare-Items) · [Ghosting](https://support.syncsketch.com/hc/en-us/articles/32393970791060-Ghosting-Onion-Skinning)
17. [Frame.io V4 player and commenting](https://blog.frame.io/2024/05/28/frame-io-v4-features-player-and-commenting/) · [Frame.io V4 NAB 2025](https://blog.frame.io/2025/04/02/frame-io-version-4-nab-2025-releases/)
18. [EditLogic: auto-sync clips to beat in CapCut](https://editlogic.io/how-to-automatically-sync-video-clips-to-a-music-beat-in-capcut/) · [Creatively Squared: beats in CapCut](https://www.creativelysquared.com/article/how-to-add-beats-to-music-in-capcut-for-perfect-video-timing)
19. [Frame.io Insider: Premiere Essential Sound automation](https://blog.frame.io/2024/08/07/insider-tips-premiere-pro-essential-sound-automation/) · [RedShark: Premiere AI audio tools](https://www.redsharknews.com/using-premiere-pros-latest-ai-audio-tools)
20. [Adobe: edit audio in Premiere](https://adobe.com/ph_en/products/premiere/edit-audio.html)
21. [Descript: the editor interface](https://help.descript.com/hc/en-us/articles/37585546799757-The-editor-interface) · [Underlord](https://help.descript.com/hc/en-us/articles/36803785502221-Underlord-beta-Your-AI-co-editor-in-Descript)
22. [Pibox: Frame.io review and alternatives](https://pibox.com/resources/frame-io-review-and-alternatives/) · [Notetracks vs Frame.io](https://www.notetracks.com/comparison/frame)

> **Evidence summary.** Strongest, multi-source: panel + animatic views, click-on-frame comments, drawing, markers, compare with linked playback, waveform-timed comments, ducking. Single-source or vendor-only: range comments via I/O (Frame.io), stems, text-based script editing. What would change the picture: usability data comparing pins with drawing for first-time reviewers, or evidence that guided review slows repeat reviewers in practice.
