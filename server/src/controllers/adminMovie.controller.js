import Movie from "../models/movie.model.js";
import catchAsync from "../utils/catchAsync.js";

export const createMovie = catchAsync(async (req, res, next) => {
  const movieData = req.body;
  
  const existingMovie = await Movie.findOne({ tmdbId: movieData.tmdbId });
  if (existingMovie) {
    return res.status(400).json({ 
      success: false, 
      message: "Movie with this TMDB ID already exists" 
    });
  }
  
  const movie = new Movie(movieData);
  await movie.save();
  
  res.status(201).json({
    success: true,
    data: movie
  });
});

export const getAllMovies = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const [movies, total] = await Promise.all([
    Movie.find().sort(sort).skip(skip).limit(parseInt(limit)),
    Movie.countDocuments()
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      movies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

export const getMovieById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const movie = await Movie.findById(id);
  
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: "Movie not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: movie
  });
});

export const updateMovie = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const movieData = req.body;
  
  const movie = await Movie.findByIdAndUpdate(
    id,
    movieData,
    { returnDocument: 'after', runValidators: true }
  );
  
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: "Movie not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: movie
  });
});

export const deleteMovie = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const movie = await Movie.findByIdAndDelete(id);
  
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: "Movie not found"
    });
  }
  
  res.status(200).json({
    success: true,
    message: "Movie deleted successfully"
  });
});
