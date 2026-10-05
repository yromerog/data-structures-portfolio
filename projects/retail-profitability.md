---
layout: default
title: "Project 2: Retail Profitability & Pricing"
---

<div class="reveal" markdown="1">

# What Discounting Does to Profit in Retail Orders

A regression project built for DTSC 2301, looking at how discount depth and product category relate to whether a retail order actually makes money.

</div>

<div class="reveal" markdown="1">

## Problem Definition

This is a regression project. I'm predicting `Profit`, a continuous dollar amount, not sorting orders into categories. Profit can land anywhere from a loss to a solid gain, and that's what I want the model to estimate for a given order.

The question driving this: retailers lean on discounts constantly to move product, but a discount that's too deep can turn a sale into a net loss. If nobody's watching where that tipping point sits, a company can end up subsidizing sales it thinks are helping the business. So: how much do discount percentage and product category actually explain about whether an order makes or loses money, and where does the breaking point fall? A pricing or merchandising analyst is the person who'd use an answer to this.

</div>

<div class="reveal" markdown="1">

## Background and Context

Discounting is a trade-off, not a free lever. Blattberg and Neslin (1990) describe this directly in their foundational work on sales promotions: a discount can effectively shift when and how much people buy, but every promotion carries a margin cost that has to be weighed against the extra volume it brings in.

On the modeling side, I compared a simple, interpretable model against a more flexible one. Breiman (2001), who introduced the random forest algorithm I used here, notes that ensembles of decision trees can capture non-linear relationships and interactions between variables that a straight-line model misses. That mattered here, since I suspected a discount's effect on profit would depend on which product category it hit, not just the discount number alone.

Picking which columns feed a model is its own kind of decision, so I also leaned on Kaufman, Rosset, Perlich, and Stitelman (2012), who lay out how data leakage, using information that's circularly tied to the target, sneaks into real projects. That shaped a specific call I had to make about the `Sales` column (below).

Once a model like this works, the real question becomes what to do with it. Bertsimas and Kallus (2020) make the case that a prediction isn't the same thing as a decision: a model that flags a losing discount pattern doesn't automatically tell a team what policy to put in its place. I come back to that distinction in the reflection section.

</div>

<div class="reveal" markdown="1">

## Data Description

I used the "Sample Superstore" dataset, a well-known public training dataset originally distributed by Tableau Software, pulled from a GitHub mirror and saved locally in this repo. I deliberately used this public dataset instead of real data from my own retail job. I have hands-on access to real retail systems through work, but that data isn't mine to publish on a public class portfolio, so I picked a dataset built for exactly this kind of practice instead.

Each row is one line item on a customer order (an order with 2 products is 2 rows). The target is `Profit`, in dollars. The features available: `Sales`, `Quantity`, `Discount`, `Category`/`Sub-Category`, `Region`, `Segment`, and `Ship Mode`. After cleaning (below), the dataset is 9,994 order lines.

</div>

<div class="reveal" markdown="1">

## Data Understanding and Exploration

The raw CSV I downloaded turned out to be messier than advertised: it had 10,800 rows, not the 9,994 the dataset is known for. The original Tableau workbook has three separate sheets, Orders, Returns, and a list of regional managers, and whoever exported it to one CSV stacked all three on top of each other with no separator, so a return record and a manager's name ended up sitting in the same columns as real order data. I kept only the rows where `Sales` and `Profit` were both present, which landed exactly on the dataset's documented size of 9,994 unique order lines with zero duplicates, a good sign I isolated the right table.

![Distribution of profit per order line, showing most orders are a modest gain but a long tail of losses](/assets/img/project2/profit_distribution.png)

Profit ranges from about -$6,600 to +$8,400 on a single line item, and the standard deviation ($234) dwarfs the average ($28.66): profit swings a lot, it doesn't cluster around a typical value. About 18.7% of all order lines lose money, nearly one in five.

![Scatter plot of discount versus profit, showing profit turns negative above roughly 20% discount](/assets/img/project2/discount_vs_profit.png)

This chart shapes the rest of the project. Average profit is positive at 0 to 20% discount, flips negative once discount passes about 20%, and bottoms out in the 40 to 60% discount range. Discounting has a real breaking point, not a gradual cost, and it arrives earlier than I expected going in.

![Boxplot of profit by product category, showing Technology far more profitable than Furniture](/assets/img/project2/profit_by_category.png)

Category matters too: Technology orders average about $79 profit per line, Office Supplies about $20, and Furniture only about $9, even though Furniture items often carry a higher sales price per item. Category is tracking a real difference in how profitable a dollar of sales actually is.

Correlation backed this up: `Sales` correlates with `Profit` at 0.48, `Discount` at -0.22, and `Quantity` barely at all (0.07). That told me `Discount`, `Sales`, and `Category` had to be in the model; I kept `Quantity`, `Region`, `Segment`, and `Ship Mode` in too, since a single correlation number can't rule out an interaction effect that a more flexible model might still find.

</div>

<div class="reveal" markdown="1">

## Data Preparation and Feature Selection

I dropped identifier columns on purpose, `Row ID`, `Order ID`, `Customer ID/Name`, `Product ID/Name`, `City`, `State`, `Postal Code`, dates, and `Country` (every row is "United States," so it explains nothing). A model that "learns" from a customer's name isn't learning anything generalizable; it's memorizing which specific customers happened to be in the training data.

The categorical features (`Category`, `Sub-Category`, `Region`, `Segment`, `Ship Mode`) got one-hot encoded: each category becomes its own 0/1 column, since models can't read text labels directly. Doing this before the train/test split is safe here specifically because these are small, fixed sets of categories guaranteed to appear the same way in both splits. That's a different situation from a numeric scaler or an encoding learned from the data's values, which does have to be fit on the training set only.

On data leakage, specifically: this is the one feature decision I want to flag clearly, because it's the kind of trap Kaufman et al. (2012) describe. `Sales` and `Profit` come from the same transaction and are correlated by construction; profit is roughly sales minus cost, so of course they move together. I kept `Sales` in anyway, because a retailer genuinely knows the sale amount before profit is finalized. It isn't information from the future, and it isn't the target in disguise. But it does mean part of this model's accuracy is inflated by that built-in relationship rather than a freshly discovered pattern; I come back to this in the reflection below.

I split the data 80/20 with a fixed random seed, so every evaluation number below comes from rows no model ever saw during training. I used a random split rather than a time-based one, since this isn't a forecasting problem (predicting the future from the past); it's predicting an unknown order's profit from its known characteristics.

</div>

<div class="reveal" markdown="1">

## Baseline and Model Development

Before trusting any real model, I needed a floor to clear: a baseline that just predicts the average training profit for every order, regardless of its features. If a real model can't beat that, it isn't adding value.

I compared two models that sit at opposite ends of a real trade-off: Linear Regression, which fits a straight-line relationship per feature and is easy to explain to a non-technical audience one coefficient at a time, and Random Forest, an ensemble of decision trees that, per Breiman (2001), can pick up non-linear effects and interactions. That mattered here, since the exploration above suggested discount's effect on profit depends on category, not just the discount number alone. Both were trained and evaluated on identical data splits, so the comparison is fair.

</div>

<div class="reveal" markdown="1">

## Model Evaluation and Selection

| Model | Train R² | Test MAE | Test RMSE | Test R² |
|---|---|---|---|---|
| Baseline (mean) | 0.00 | $67.55 | $220.43 | -0.00 |
| Linear Regression | 0.49 | $67.80 | $282.42 | -0.65 |
| Random Forest | 0.96 | $26.65 | $223.20 | -0.03 |

I'm reporting three metrics because they disagree here, and the disagreement is itself worth explaining. MAE is unambiguous: Random Forest's typical prediction is off by about $27, versus roughly $68 for the baseline and Linear Regression, a real, large improvement. RMSE and R² land differently: Random Forest's test R² sits slightly below the baseline's, and Linear Regression is worse than the baseline on every single metric.

The reason is the outliers flagged in the exploration section. RMSE and R² square every error before averaging, so a handful of giant misses on rare, huge-dollar orders can swamp thousands of otherwise-solid predictions; MAE doesn't square anything, so it isn't distorted the same way. I also compared each model's train vs. test R²: Random Forest drops from 0.96 to -0.03, and Linear Regression drops from 0.49 to -0.65. Both are signs of real overfitting, but Random Forest's overfitting still lands in a far more useful place on the metric (MAE) that reflects everyday-order accuracy.

My pick is Random Forest, with a caveat I'd rather state than bury: on RMSE and R², it doesn't clearly beat "just guess the average." What it does do is cut the typical prediction error by more than half. For a team that cares about getting a normal, everyday order about right, Random Forest wins clearly. For a team specifically worried about rare, catastrophic misses on huge orders, none of these three models should be fully trusted yet, see the reflection below. Linear Regression isn't a serious contender here; it loses to the baseline on every metric, so its interpretability advantage isn't worth what it gives up in accuracy in this case.

</div>

<div class="reveal" markdown="1">

## Model Interpretation and Insights

![Bar chart of the top 10 most important features in the Random Forest model, led by Sales and Discount](/assets/img/project2/feature_importance.png)

`Sales` and `Discount` dominate the Random Forest's feature importances. `Sales` alone accounts for roughly 75% of total importance, `Discount` a distant second at about 16%. Part of `Sales`'s dominance is the same built-in sales-profit relationship flagged above, not purely a new discovery. Linear Regression's coefficients point the same direction: `Discount` carries the single most negative coefficient in the whole model (-$237.53), while categories like Copiers (+$271.49) and Technology (+$57.90) push profit up. Two very different modeling approaches landing on the same answer is a stronger signal than either one alone.

Looking at the Random Forest's worst individual misses, the single largest error (an $8,131 miss) landed on the largest `Sales` value in the entire test set: a $22,638 line item, discounted 50%, that was actually a $1,811 loss but which the model predicted as a $6,320 gain. That's the kind of order dragging RMSE and R² down above, even while the model quietly handles thousands of smaller, typical orders well. The model is reliable for everyday order sizes and shaky on rare, large, one-off ones.

The takeaway for a pricing or store team: discounting past roughly 20% is where margin starts breaking down on average, and that breaking point shows up consistently whether I look at a bucket-average chart, a linear model's coefficients, or a random forest's feature importances. Three different lenses landing on the same number is why I trust it enough to call it the headline result of this project.

</div>

<div class="reveal" markdown="1">

## Limitations, Ethics, and Reflection

This is public sample data, not a real company's books. I made that call deliberately, choosing not to use real data from my own retail job even though I have access to it, because it isn't mine to publish on a public portfolio. None of these numbers describe any real business.

There's no cost-of-goods column anywhere in this dataset, so "discount and category predict profit" is a real, actionable signal, but I can't fully separate "discount causes lower margin" from "discount happens to correlate with other things I can't see," like a product that was already thin-margin before any discount touched it.

The outlier sensitivity from the evaluation section is itself a limitation, not just a quirk: whether this model looks like a clear win or basically a tie with the baseline depends heavily on which metric gets asked for, and with a test set of only about 2,000 rows, one or two $20,000 orders landing in that split can swing R² and RMSE substantially. A next step worth trying is log-transforming `Profit` or capping the most extreme values before modeling; that tends to make regression less dominated by a handful of outliers, though it also makes the dollar predictions harder to explain directly. I didn't do it here, but it's a real trade-off worth revisiting.

Who's affected if a real team leaned on this: Bertsimas and Kallus (2020) make the point that a prediction isn't automatically a good decision. If a team saw "discounts over 20% lose money" and responded by cutting every deep discount everywhere, they might also kill off sales events that were working for reasons this model can't see, clearing old inventory, matching a competitor, and so on. A false "this discount is fine" signal costs a real loss on that order; a false "this discount will lose money" signal just costs a missed sale. Those aren't the same size of mistake, and a team using this would need to know which one they're more worried about before acting on it.

Before I'd trust this in an actual decision, I'd want real cost data, a longer time window (this dataset has no view of discount strategy changing over time), and ideally an actual experiment, testing a discount cap on some stores and not others, rather than only looking backward at historical correlations, which can't fully separate the discount's effect from everything else about that order.

</div>

<div class="reveal" markdown="1">

## Code and AI Transparency

The full notebook, all the code behind every chart and number on this page, is published at [github.com/yromerog/data-structures-portfolio/blob/main/2nd_project.ipynb](https://github.com/yromerog/data-structures-portfolio/blob/main/2nd_project.ipynb), along with the dataset I used (`data/superstore.csv`).

Dataset citation: Tableau Software. (n.d.). *Sample – Superstore* [Dataset]. Mirrored from `https://raw.githubusercontent.com/leonism/sample-superstore/master/data/superstore.csv`.

AI usage disclosure: I used Claude Code to help scaffold and debug specific pieces of this project, the exact pandas/scikit-learn syntax for one-hot encoding, the train/test split, fitting the three models, and pulling together the comparison table and charts, plus tracking down and verifying the sources cited below. The problem I chose to ask, which features to include or exclude and why, how to read and interpret the actual results (including the messy R²/MAE disagreement in the evaluation section), and the limitations and ethics discussion above are mine. I limited how much I leaned on AI to what I could fully understand, explain, and defend, the same approach I used on my first project.

### References

Bertsimas, D., & Kallus, N. (2020). From predictive to prescriptive analytics. *Management Science, 66*(3), 1025–1044.

Blattberg, R. C., & Neslin, S. A. (1990). *Sales promotion: Concepts, methods, and strategies*. Prentice Hall.

Breiman, L. (2001). Random forests. *Machine Learning, 45*(1), 5–32.

Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM Transactions on Knowledge Discovery from Data, 6*(4), 1–21.

[← Back to Projects](../projects.html)

</div>
