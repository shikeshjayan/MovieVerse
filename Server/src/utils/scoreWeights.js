// utils/scoreWeights.js
const WEIGHTS = {
  history:    1.0,
  watchlater: 0.7,
  wishlist:   0.5,
  review_5:   2.0,
  review_4:   1.5,
  review_3:   0.5,
  review_2:  -0.5,
  review_1:  -1.0,
};

export default WEIGHTS;