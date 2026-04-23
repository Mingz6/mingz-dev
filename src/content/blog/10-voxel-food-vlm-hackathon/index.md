---
title: "What a half-finished food-detection hackathon taught me about VLMs"
summary: "Hackathon project: photograph a plate, get nutritional analysis. Never shipped, ran out of weekend, learned a lot anyway. Here's what's worth knowing about Visual Language Models, FiftyOne, and dataset pivots."
date: "Mar 15 2025"
tags:
- AI
- Computer Vision
- Hackathon
draft: false
---

The pitch was simple: take a picture of your plate, get a macro/micro-nutrient breakdown plus allergen detection. Useful for diabetics, people with celiac, anyone tracking intake without typing meals into MyFitnessPal.

We didn't finish. The repo ([VoxelFoodNutritionDetector](https://github.com/Mingz6/VoxelFoodNutritionDetector)) is two Jupyter notebooks, a slide deck, and a README that says "we'll figure that out later" with no irony intended.

But the techniques we picked up on the way are worth knowing about, even if the project itself never made it.

## Visual Language Models: image in, natural language out

Visual Language Models (VLMs) combine computer vision with NLP. You feed them an image and ask questions in natural language — *"what's on this plate?"* — and get text back. They're the obvious tool for any "describe this picture" use case.

We used [Moondream2](https://huggingface.co/vikhyatk/moondream2) — small enough to run on a laptop, capable enough to caption food photos and answer Visual QA prompts. We also looked at Janus but didn't fully integrate it.

The questions we asked the model:

- *"What food items are on the plate?"*
- *"What percentage of the plate does each item cover?"*
- *"What is the estimated nutritional content?"*

Item identification worked well. Surface-area estimation was hit-or-miss. Direct nutritional estimation was hopeful at best — VLMs aren't lookup tables, and "estimated calories" from a photo is a confidence interval wide enough to drive a truck through.

The lesson: VLMs are great for *describe* and *classify*. They're bad for *measure*. Use them as the first stage of a pipeline, not the whole pipeline.

## FiftyOne for dataset wrangling

[FiftyOne](https://docs.voxel51.com/) (by Voxel51) is the dataset-curation tool for computer vision that I wish I'd known about sooner. It lets you load a dataset, visualise it interactively in a browser, filter by metadata or model predictions, and annotate samples.

```bash
pip install fiftyone
```

```python
import fiftyone as fo
import fiftyone.zoo as foz

dataset = foz.load_zoo_dataset("coco-2017", split="validation")
session = fo.launch_app(dataset)
```

That's enough to get a UI where you can scroll through tens of thousands of images, filter by class, sort by model confidence, find mislabeled samples. For any CV project bigger than "ten test images," it pays back the install time within an hour.

## Dataset pivots are real

Our first plan was Google Research's [Nutrition5k](https://github.com/google-research-datasets/Nutrition5k) — paired RGB-D and depth video for thousands of dishes, with ground-truth nutritional labels. Perfect on paper.

Disk size: 181.4 GB.

It turns out you can't iterate on a 181 GB dataset on a hackathon laptop. We pivoted to [TeeA/nutrition5k-food-name-gemini](https://huggingface.co/datasets/TeeA/nutrition5k-food-name-gemini) on Hugging Face — same dishes, image-only, with Gemini-generated food name labels. About 1% of the size.

The pivot cost us a few hours. The non-pivot would have cost us the whole hackathon. The lesson is permanent: **before downloading anything, check the dataset size against your actual disk and bandwidth**. The biggest, most prestigious dataset is rarely the right one for a 48-hour project.

The tradeoff is also worth naming. The HF dataset has Gemini-generated labels, not human ground truth. For a hackathon demo, the noise was acceptable. For a production model, it would have been disqualifying.

## The pipeline we never finished

The theoretical pipeline:

1. **Detect** food items on the plate (VLM or zero-shot detector)
2. **Estimate surface area** of each item (segmentation + camera calibration)
3. **Convert surface area to mass** (food-specific density tables)
4. **Look up nutrition** (USDA database keyed on food name + mass)

Steps 1 and 4 were easy. Step 2 was the hard part — depth estimation from a single RGB image is solvable but not in a weekend. Step 3 needs a per-food density table that doesn't exist as a clean dataset (we'd have to scrape it).

If I revisited this today (April 2026), the right answer would probably be: skip the depth math entirely. Use a VLM with chain-of-thought prompting to estimate portion sizes ("looks like roughly one cup of rice, half a chicken breast, a side of broccoli"), then look up nutrition for those normalised portions. You lose precision but gain finishability.

That's the meta-lesson too. Hackathons reward "good enough across the whole pipeline" over "perfect at one stage."

## What I actually learned

- **VLMs** exist and are accessible. You can run a competent one on a laptop.
- **FiftyOne** is the right starting point for any CV dataset you don't already know intimately.
- **Dataset pivots** are not failures, they're a normal step. Plan for them.
- **Surface-area-to-mass** is harder than it sounds. Use VLM portion estimation if you don't have time for proper depth modelling.
- **"We'll figure that out later"** is a phrase that should trigger an immediate pivot meeting, not a `git commit`.

The repo is archived now. The knowledge is here.
