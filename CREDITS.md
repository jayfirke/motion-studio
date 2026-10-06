# Credits

motion-studio was built in October 2026 by Jay Firke with [Claude Code](https://claude.com/claude-code) (Anthropic). Almost nothing here is new: it is a careful arrangement of ideas, tools and sounds that other people made and shared. Thank you all.

**What this repo does and doesn't contain.** It contains code and documents I wrote, plus third-party files whose licences allow redistribution (CC0 sounds and music, OFL fonts, MIT/ISC/Apache-2.0 libraries), each listed below. It does **not** contain anyone's videos, PDFs, paid or private creator kits, or Mixkit audio. Those are credited and linked so you can get them from their creators.

If you see your work here without the credit you'd like, or want something removed, please open an issue.

## People whose videos taught me

These videos started the project and shaped its rules. Watch them; they explain things better than any README.

| Video | Creator | What it gave this studio |
|---|---|---|
| [How to Make Insane Motion Graphics With Opus 5.5](https://www.youtube.com/watch?v=747ZnEtsRbg) (2026-09-29) | [Lukas Margerie](https://www.youtube.com/channel/UCIZmRlV_wjS8jFQTbRxCV4g) | The "moves" behind the house rules: carry don't replace, vary shot length, springs with weight, the critique loop |
| [Claude Opus 5.5 Is INSANE at Motion Graphics](https://www.youtube.com/watch?v=OIAWkkSO4WY) (2026-10-02) | [RandomAI](https://www.youtube.com/channel/UCuyTqd701wPfaLRJY2C_4_A) | What Opus can do with HyperFrames; the first reel workflow |
| [Claude Code Can Now Automate Your Videos (Remotion + Opus 5.5)](https://www.youtube.com/watch?v=6_rCyryA6hg) (2026-10-01) | [Roboverse](https://www.youtube.com/channel/UCZ3KGRwOA_uONNE_6VGG2bA) | The Remotion side: React videos driven by Claude Code |
| [AI Motion Graphics That Don't Look Like PowerPoint (Claude Design vs Hyperframes vs Remotion)](https://www.youtube.com/watch?v=nIY9H4mq-7Y) (2026-05-30) | [Sandy Lee AI](https://www.youtube.com/channel/UCcrH_UUxL4KFjS3pwaXvMXA) | Engine comparison, and the "not a slide deck" bar |
| [GLM 5.2 - HyperFrames vs Remotion vs Revideo](https://www.youtube.com/watch?v=zUysdQkMAVo) (2026-06-20) | [AI Andy](https://www.youtube.com/channel/UCn2RJFAA1ndipnVJsYAwWOw) | Engine comparison used in the research |

## Creator kits (not included; get them from their creators)

| Kit | Creator | Notes |
|---|---|---|
| **Motion Graphics with Claude Code**: PDF guide and starter kit, 14 tested prompts | Damiano Caudullo, [@damianodesu](https://instagram.com/damianodesu) | Taught the HyperFrames prompt style and the four looks. Its files, prompts and sounds are not in this repo. |
| **Motion as Code**: workflow guide and starter kit (voiceover-driven explainer) | An Instagram creator (the kit doesn't name them; tell us and we'll credit you) | Its visual engine is [pdoom-video](https://github.com/mexicat/pdoom-video) by mexicat (Giacomo Magnanini, MIT). Taught the "every frame is a function of time" render contract. |
| **Motion Reel Kit** (motion-reel): beat-synced reels, synthesized score, critique scorecard | [Lukas Margerie](https://www.youtube.com/channel/UCIZmRlV_wjS8jFQTbRxCV4g) · [weekly10x.com](https://www.weekly10x.com) | The critique-loop idea and the eight scores come from here (`docs/critique-scorecard.md` is our own wording). Optional engine: install it from your own copy. |

## Engines, skills and tools

| Project | Author | Licence | Used for |
|---|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) (CLI, registry, Claude skills and plugins) | HeyGen | Apache-2.0 | Default engine: HTML + GSAP compositions rendered to video |
| [Remotion](https://www.remotion.dev) and [remotion-dev/skills](https://github.com/remotion-dev/skills) | Remotion | [Remotion licence](https://www.remotion.dev/docs/license) (free for individuals and teams up to 3) | React video engine |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (and the fork [JohnChow90/video-shotcraft](https://github.com/JohnChow90/video-shotcraft)) | Vincentwei1021 and contributors | Apache-2.0 | Product films: shot recipe cards, 2.5D page camera, sound-design rules; the 157 shot-card summaries in `_shared/catalog.json` |
| [bang-motion](https://github.com/bangtutorial/bang-motion) | [Bang Tutorial](https://youtube.com/bangtutorial) | MIT | Openers, bumpers, kinetic type; the anti-slide-deck checks |
| [onetake](https://github.com/feitangyuan/onetake) | feitangyuan | PolyForm Noncommercial 1.0.0 | Ideas only in this repo: carry, rhythm, operated camera, verify oracle |
| [diffusionstudio/lottie](https://github.com/diffusionstudio/lottie) (text-to-lottie skill, Skottie player) | Diffusion Studio | MIT | Lottie elements |
| [Diffusion Studio](https://diffusion.studio) | Diffusion Studio | Open-source editor | Editing real footage, masks, contact sheets |
| [brag](https://github.com/latent-spaces/brag) | latent-spaces ([letsbrag.app](https://letsbrag.app)) | MIT | Ideas for the plan rubric: hook in 2 s, entry → key action → result |
| [Motion showreel master prompt](https://gist.github.com/mirzemehdi/4a84c5cb487b4a5edceb259eac625469) | [mirzemehdi](https://github.com/mirzemehdi) | Public gist | The phone-mode ideas: code-drawn phone, touch ring, pieces lifting out of the screen |
| [Fish Audio](https://fish.audio) API, [fish-audio-api / fish-audio-sdk skills](https://docs.fish.audio) | Fish Audio | API terms; `s2.1-pro-free` output usable commercially (businesses under $1M ARR) | Voice-over; the demo's voice is **Sarah**, a Fish Audio official voice |
| [Freesound](https://freesound.org) | Music Technology Group, Universitat Pompeu Fabra, and every uploader | Per sound (CC0 here) | Recorded foley and music beds, via `_shared/tools/freesound.py` |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Georgi Gerganov and ggml contributors | MIT | Local word timings |
| [OpenSuperWhisper](https://github.com/Starmel/OpenSuperWhisper) | Starmel | see repo | Where the local Whisper model lives on macOS |
| [Agent Reach](https://github.com/Panniantong/Agent-Reach) | Panniantong | see repo | Web and YouTube research during the build |
| [watch](https://github.com/bradautomates/claude-video) (Claude plugin) | bradautomates | see repo | Watching the reference videos frame by frame |
| [skills CLI](https://www.npmjs.com/package/skills) | Vercel Labs | see package | Installing agent skills |
| [three.js](https://threejs.org) | three.js authors | MIT | 3D in films |
| [GSAP](https://gsap.com) | GreenSock / Webflow | [GSAP Standard License](https://gsap.com/standard-license) | Timelines in HyperFrames and bang-motion |
| [ZzFX](https://github.com/KilledByAPixel/ZzFX) | Frank Force | MIT | Sound sketches in Prompt Studio |
| [Lucide](https://lucide.dev) | Lucide contributors | ISC | Icons in Prompt Studio and Previs Studio |
| [FFmpeg](https://ffmpeg.org) | FFmpeg developers | LGPL/GPL | Every audio and video conversion |
| [librosa](https://librosa.org), [NumPy](https://numpy.org), [SciPy](https://scipy.org), [soundfile](https://github.com/bastibe/python-soundfile), [Pillow](https://python-pillow.org) | their authors | ISC / BSD / MIT-CMU | Beat grids, mixing, contact sheets |
| [Playwright](https://playwright.dev) | Microsoft | Apache-2.0 | Rendering and Previs Studio's browser checks |
| [uv](https://github.com/astral-sh/uv), [Homebrew](https://brew.sh) | Astral; Homebrew contributors | MIT / Apache-2.0; BSD-2 | Setup |

Previs Studio is built with [React](https://react.dev), [Vite](https://vite.dev), [TypeScript](https://www.typescriptlang.org), [Tailwind CSS](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com), [zustand](https://github.com/pmndrs/zustand), [zod](https://zod.dev), [cmdk](https://cmdk.paco.me), [sonner](https://sonner.emilkowal.ski) and [axe-core](https://github.com/dequelabs/axe-core) (tests). Licences of the bundled libraries: `_shared/previs/studio/THIRD-PARTY-NOTICES.md`.

## Sounds and music

All recorded sounds and music beds shipped here are **CC0** (public domain). CC0 asks for nothing, but these people did the work:

- **UI SFX** by [Yuki Capital](https://uisfx.com) ([romainsimon/uisfx](https://github.com/romainsimon/uisfx)): 936 procedurally generated UI sounds, CC0.
- **Kenney** ([kenney.nl](https://kenney.nl)): 706 sounds from 9 audio packs, CC0.
- **Freesound uploaders** (sounds used by the studio, the demo film and Prompt Studio):

| Uploader | Sounds (Freesound id: name) |
|---|---|
| [1bob](https://freesound.org/people/1bob/) | [651514](https://freesound.org/s/651514/) paper |
| [_stubb](https://freesound.org/people/_stubb/) | [406586](https://freesound.org/s/406586/) Picture Drop_Heavy Paper_Near_Mono |
| [Alien_I_Trust](https://freesound.org/people/Alien_I_Trust/) | [785817](https://freesound.org/s/785817/) Darkwave Reactor |
| [apinasaundi](https://freesound.org/people/apinasaundi/) | [405705](https://freesound.org/s/405705/) found matress hit.wav |
| [AudioPapkin](https://freesound.org/people/AudioPapkin/) | [541029](https://freesound.org/s/541029/) Very low frequency impact.wav |
| [Baconation](https://freesound.org/people/Baconation/) | [592443](https://freesound.org/s/592443/) Swipe Up |
| [Bertsz](https://freesound.org/people/Bertsz/) | [671900](https://freesound.org/s/671900/) Calm background Music |
| [bigmonmulgrew](https://freesound.org/people/bigmonmulgrew/) | [378083](https://freesound.org/s/378083/) mechanical key soft.wav, [378084](https://freesound.org/s/378084/) mechanical key medium.wav, [378085](https://freesound.org/s/378085/) mechanical key hard.wav |
| [Breviceps](https://freesound.org/people/Breviceps/) | [447909](https://freesound.org/s/447909/) Keyboard typing, [448080](https://freesound.org/s/448080/) Wet Click |
| [BuytheField](https://freesound.org/people/BuytheField/) | [414441](https://freesound.org/s/414441/) Bell Beats.wav |
| [cabled_mess](https://freesound.org/people/cabled_mess/) | [335361](https://freesound.org/s/335361/) Little, happy tune - 22.10.2015 |
| [code_box](https://freesound.org/people/code_box/) | [561190](https://freesound.org/s/561190/) Tropicorp Advertisement, [566952](https://freesound.org/s/566952/) Funky Groove |
| [danluxradium](https://freesound.org/people/danluxradium/) | [767613](https://freesound.org/s/767613/) Ring Drop |
| [Detski](https://freesound.org/people/Detski/) | [170601](https://freesound.org/s/170601/) Wet Square Techno Beat With Toppings.wav |
| [DeVern](https://freesound.org/people/DeVern/) | [384202](https://freesound.org/s/384202/) Slow Cinematic Music.wav |
| [eyesonlegs](https://freesound.org/people/eyesonlegs/) | [464302](https://freesound.org/s/464302/) PaperSlide.wav |
| [florianreichelt](https://freesound.org/people/florianreichelt/) | [683101](https://freesound.org/s/683101/) quick woosh |
| [Foxfire-](https://freesound.org/people/Foxfire-/) | [570754](https://freesound.org/s/570754/) Keyboard - Press down |
| [frankum](https://freesound.org/people/frankum/) | [337309](https://freesound.org/s/337309/) Electro base x1 |
| [holizna](https://freesound.org/people/holizna/) | [629170](https://freesound.org/s/629170/) Chill Lofi Epiano Loop 80 BPM.wav |
| [HunteR4708](https://freesound.org/people/HunteR4708/) | [256455](https://freesound.org/s/256455/) Mouse Click, [256457](https://freesound.org/s/256457/) Mouse Scrolling Slow |
| [jackieAZ](https://freesound.org/people/jackieAZ/) | [388958](https://freesound.org/s/388958/) Soft Two-Finger Snap |
| [khenshom](https://freesound.org/people/khenshom/) | [565205](https://freesound.org/s/565205/) Computer keyboard - Pressing fast and hard |
| [Kinoton](https://freesound.org/people/Kinoton/) | [427823](https://freesound.org/s/427823/) Whoosh #1 |
| [Kodack](https://freesound.org/people/Kodack/) | [395037](https://freesound.org/s/395037/) simple relaxing guitar loop |
| [ldezem](https://freesound.org/people/ldezem/) | [386216](https://freesound.org/s/386216/) Steel - Angle ring drop |
| [LilMati](https://freesound.org/people/LilMati/) | [702773](https://freesound.org/s/702773/) Swipe.wav |
| [ludvique](https://freesound.org/people/ludvique/) | [71852](https://freesound.org/s/71852/) digital_whoosh_soft.wav |
| [Lunardrive](https://freesound.org/people/Lunardrive/) | [22417](https://freesound.org/s/22417/) Single Heartbeat HQ_BeatSmith.wav |
| [memes_hodachy](https://freesound.org/people/memes_hodachy/) | [554208](https://freesound.org/s/554208/) cardsound32562 |
| [MickBoere](https://freesound.org/people/MickBoere/) | [276578](https://freesound.org/s/276578/) Heavy Heartbeat |
| [migoreng1](https://freesound.org/people/migoreng1/) | [786514](https://freesound.org/s/786514/) swoosh_v2 |
| [Mikes-MultiMedia](https://freesound.org/people/Mikes-MultiMedia/) | [349698](https://freesound.org/s/349698/) light slow swoosh.mp3 |
| [moogy73](https://freesound.org/people/moogy73/) | [425704](https://freesound.org/s/425704/) Woosh_Low_Short_01.wav, [425706](https://freesound.org/s/425706/) Woosh_Medium_Short_01.wav |
| [MTJohnson](https://freesound.org/people/MTJohnson/) | [444431](https://freesound.org/s/444431/) Sliding Envelope.wav |
| [nahmandub](https://freesound.org/people/nahmandub/) | [131337](https://freesound.org/s/131337/) Rolled paper,slapping 1.wav, [131342](https://freesound.org/s/131342/) Rolled paper,slapping 5.wav |
| [neilraouf](https://freesound.org/people/neilraouf/) | [467490](https://freesound.org/s/467490/) MacBook Pro trackpad (48/24) |
| [Nielsvdb](https://freesound.org/people/Nielsvdb/) | [513610](https://freesound.org/s/513610/) Pulsing Analog Drone |
| [pbimal](https://freesound.org/people/pbimal/) | [534103](https://freesound.org/s/534103/) mouse-click-single-00.flac |
| [Pixeliota](https://freesound.org/people/Pixeliota/) | [678248](https://freesound.org/s/678248/) Mouse Click Sound.mp3 |
| [PollyannaMedia](https://freesound.org/people/PollyannaMedia/) | [541434](https://freesound.org/s/541434/) heartbeat.wav |
| [Sclolex](https://freesound.org/people/Sclolex/) | [179779](https://freesound.org/s/179779/) wipe2.wav |
| [Sergmusic](https://freesound.org/people/Sergmusic/) | [639933](https://freesound.org/s/639933/) Blue Sky.mp3 |
| [Seth_Makes_Sounds](https://freesound.org/people/Seth_Makes_Sounds/) | [655615](https://freesound.org/s/655615/) Happy Hip Hop Beat, [670039](https://freesound.org/s/670039/) Chill Background Music, [679738](https://freesound.org/s/679738/) Calming Piano Loop 60bpm, [691837](https://freesound.org/s/691837/) Easy Going Music Loop |
| [shortiefoeva2](https://freesound.org/people/shortiefoeva2/) | [412048](https://freesound.org/s/412048/) Making Up (soft Hip Hop) |
| [Spacekittycat](https://freesound.org/people/Spacekittycat/) | [754201](https://freesound.org/s/754201/) Fast keyboard typing |
| [syntheffects](https://freesound.org/people/syntheffects/) | [685256](https://freesound.org/s/685256/) Riser sound effect short.wav |
| [szegvari](https://freesound.org/people/szegvari/) | [607304](https://freesound.org/s/607304/) Beach Dance - EDM Dance Cinematic Party Eletro Chill Happy 120bpm Music - EQ Mastered.wav |
| [Tomoyo Ichijouji](https://freesound.org/people/Tomoyo Ichijouji/) | [211246](https://freesound.org/s/211246/) PageRustle |
| [UberBosser](https://freesound.org/people/UberBosser/) | [421581](https://freesound.org/s/421581/) wKey.wav, [421583](https://freesound.org/s/421583/) qKey.wav |
| [vacuumfan7072](https://freesound.org/people/vacuumfan7072/) | [332713](https://freesound.org/s/332713/) Tap.flac |
| [videofueralle](https://freesound.org/people/videofueralle/) | [614153](https://freesound.org/s/614153/) Swishes_11_gentle.wav, [614156](https://freesound.org/s/614156/) Swishes_16_soft_slower.wav |
| [xkeril](https://freesound.org/people/xkeril/) | [701104](https://freesound.org/s/701104/) Whoosh stereo light (transition) |
| [zekybomb](https://freesound.org/people/zekybomb/) | [677658](https://freesound.org/s/677658/) Fast Typying.mp3 |
| [ZHRØ](https://freesound.org/people/ZHRØ/) | [688675](https://freesound.org/s/688675/) Chill Lofi piano music |

Not included: **Mixkit** sounds and music ([mixkit.co](https://mixkit.co)), which video-shotcraft ships. Their licence allows them inside rendered videos but not as files, so projects keep them out of git.

## Fonts

All under the [SIL Open Font License 1.1](_shared/LICENSES/OFL-1.1.txt), from [Google Fonts](https://fonts.google.com): Inter (Rasmus Andersson), Space Grotesk (Florian Karsten), Archivo Black (Omnibus-Type), Instrument Serif (Instrument), Bricolage Grotesque (Ateliertriay), JetBrains Mono (JetBrains), and Hanken Grotesk (Hanken Design Co.) for Previs Studio's interface. The demo film's looks load more Google Fonts at runtime.

## Research and design references (ideas only)

Previs Studio's review UX was designed after studying how these products let people see, choose, comment and approve. No code or assets were taken from them: [Frame.io](https://frame.io) (anchored comments, compare viewer), [Boords](https://boords.com) and [StudioBinder](https://www.studiobinder.com) (storyboards), [Storyboarder](https://github.com/wonderunit/storyboarder) (Wonder Unit), [SyncSketch](https://syncsketch.com) and [Krock](https://krock.io) (review states, ghosting), [Vimeo review](https://vimeo.com), [Dropbox Replay](https://www.dropbox.com/replay), [SoundCloud](https://soundcloud.com) and [BandLab](https://www.bandlab.com) (timed comments), [Epidemic Sound](https://www.epidemicsound.com) (music matching), [CapCut](https://www.capcut.com), [Descript](https://www.descript.com), [Adobe Premiere](https://www.adobe.com/products/premiere.html), [Canva](https://www.canva.com), [Jitter](https://jitter.video), [LTX Studio](https://ltx.io/studio/platform/ai-storyboard-generator), and Nielsen Norman Group's articles on [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [wizards](https://www.nngroup.com/articles/wizards/). The full write-up with sources is `_guide/research/previs-studio-ux-research.md`.

Motion fundamentals: the [twelve basic principles of animation](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation) (Ollie Johnston and Frank Thomas), [easings.net](https://easings.net), [School of Motion](https://www.schoolofmotion.com), and [whatships.com](https://whatships.com) for launch-film references.

## Evaluated during research (not used, still thanked)

The first research session (October 2026) compared these before choosing the stack. They are good projects; links for anyone exploring alternatives:

- **Other code-video engines:** [Motion Canvas](https://github.com/motion-canvas/motion-canvas), [Revideo](https://github.com/redotvideo/revideo), [Theatre.js](https://github.com/theatre-js/theatre), [Manim](https://github.com/ManimCommunity/manim), [OpenMontage](https://github.com/calesthio/OpenMontage), [pdoom-video](https://github.com/mexicat/pdoom-video).
- **Open voice and audio models:** [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (HyperFrames' built-in voice), [Chatterbox](https://github.com/resemble-ai/chatterbox), [Indic Parler-TTS](https://huggingface.co/ai4bharat/indic-parler-tts), [Piper](https://huggingface.co/rhasspy/piper-voices), [MLX-Audio](https://github.com/Blaizzy/mlx-audio), [WhisperX](https://github.com/m-bain/whisperX), [DeepFilterNet](https://github.com/Rikorose/DeepFilterNet), [RNNoise](https://github.com/xiph/rnnoise), [jsfxr](https://github.com/chr15m/jsfxr), and the [Artificial Analysis TTS leaderboard](https://artificialanalysis.ai/text-to-speech/leaderboard).
- **Asset libraries listed in Prompt Studio** (link-only; download per their terms): [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), [Tabler Icons](https://tabler.io/icons), [Heroicons](https://heroicons.com), [Material Symbols](https://fonts.google.com/icons), [Fluent Emoji](https://github.com/microsoft/fluentui-emoji), [Open Peeps](https://www.openpeeps.com), [Humaaans](https://www.humaaans.com), [Open Doodles](https://www.opendoodles.com), [Poly Haven](https://polyhaven.com), [ambientCG](https://ambientcg.com), [Kenney particles](https://kenney.nl/assets/particle-pack), [LottieFiles free animations](https://lottiefiles.com/free-animations) and [lottie-web](https://github.com/airbnb/lottie-web), [incompetech](https://incompetech.com/music/royalty-free/), [Sonniss GDC bundles](https://sonniss.com/gdc-bundle-license/), [Pexels](https://www.pexels.com), [Unsplash](https://unsplash.com).
- **Articles and threads that informed the choices:** HyperFrames reviews by [andrew.ooo](https://andrew.ooo/posts/hyperframes-heygen-html-video-agents-review/) and [Jon Does Flow](https://www.jondoesflow.com/post/remotion-vs-hyperframes-programmatic-video), [The Agent Architect on Claude Code + Remotion](https://theagentarchitect.substack.com/p/claude-code-remotion-video-rendering), [Noel Cabral on programmatic video](https://noelcabral.com/remotion-claude-code-programmatic-video-realities), Remotion's [license FAQ](https://www.remotion.dev/docs/license/faq) and [Claude Code guide](https://www.remotion.dev/docs/ai/claude-code), [GSAP becoming free](https://webflow.com/updates/gsap-becomes-free), Mixkit's [licence](https://mixkit.co/license/), Fish Audio's [S2.1 Pro free API post](https://fish.audio/blog/s2-1-pro-free-api/), Freesound's [API terms](https://freesound.org/help/tos_api/), and Hacker News discussions of HyperFrames.

## Built with

[Claude Code](https://claude.com/claude-code) and Claude Opus 5.5 by [Anthropic](https://www.anthropic.com): every rule, script and page here was written in conversation with it, then checked by hand.
