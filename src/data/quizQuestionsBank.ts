import { QuizQuestion } from '../types';

/**
 * Generates 50 curriculum-specific, categorized MCQs for any given course
 * Structure:
 * - Questions 1-15: Easy (Fundamental definitions, terminology, core syntax)
 * - Questions 16-35: Medium (Workflow, practical applications, parameters, common pitfalls)
 * - Questions 36-50: Advanced (Optimization, internal mechanics, edge cases, system architecture)
 */

interface CourseTopicBlueprint {
  name: string;
  category: string;
  keywords: string[];
  easyConcepts: Array<{ q: string; opts: string[]; ans: number; exp: string }>;
  mediumConcepts: Array<{ q: string; opts: string[]; ans: number; exp: string }>;
  advancedConcepts: Array<{ q: string; opts: string[]; ans: number; exp: string }>;
}

export const COURSE_TOPIC_TEMPLATES: Record<string, Partial<CourseTopicBlueprint>> = {
  'intro-data-science': {
    name: 'Introduction to Data Science',
    category: 'Data Science',
    keywords: ['Data Lifecycle', 'CRISP-DM', 'Hypothesis', 'Data Types', 'Pipeline'],
  },
  'math-for-data-science': {
    name: 'Mathematics for Data Science',
    category: 'Statistics',
    keywords: ['Linear Algebra', 'Eigenvalues', 'Dot Product', 'Calculus', 'Gradients', 'Matrix Operations'],
  },
  'statistics-data-science': {
    name: 'Statistics for Data Science',
    category: 'Statistics',
    keywords: ['Hypothesis Testing', 'P-value', 'Central Limit Theorem', 'Distributions', 'Standard Deviation'],
  },
  'excel-data-analysis': {
    name: 'Excel for Data Analysis',
    category: 'Data Analytics',
    keywords: ['VLOOKUP', 'XLOOKUP', 'Pivot Tables', 'INDEX MATCH', 'Conditional Formatting', 'Power Query'],
  },
  'sql-fundamentals': {
    name: 'SQL Fundamentals',
    category: 'SQL & Databases',
    keywords: ['SELECT', 'WHERE', 'GROUP BY', 'HAVING', 'INNER JOIN', 'PRIMARY KEY'],
  },
  'python-fundamentals': {
    name: 'Python Fundamentals',
    category: 'Programming',
    keywords: ['Lists', 'Dictionaries', 'Functions', 'List Comprehensions', 'Classes', 'Mutability'],
  },
  'python-for-data-science': {
    name: 'Python for Data Science',
    category: 'Python',
    keywords: ['Jupyter', 'Virtual Environments', 'Data Structures', 'Modules', 'Scripting'],
  },
  'numpy-mastery': {
    name: 'NumPy',
    category: 'Python',
    keywords: ['ndarray', 'Broadcasting', 'Vectorization', 'Reshape', 'Axis', 'Dot Product'],
  },
  'pandas-mastery': {
    name: 'Pandas',
    category: 'Python',
    keywords: ['DataFrames', 'Series', 'loc vs iloc', 'groupby', 'merge', 'apply', 'dropna'],
  },
  'data-cleaning-preprocessing': {
    name: 'Data Cleaning & Preprocessing',
    category: 'Data Analytics',
    keywords: ['Missing Values', 'Imputation', 'Outliers', 'IQR', 'Scaling', 'Normalization'],
  },
  'eda-exploratory-data-analysis': {
    name: 'Exploratory Data Analysis (EDA)',
    category: 'Data Analytics',
    keywords: ['Summary Statistics', 'Correlation Matrix', 'Skewness', 'Outlier Detection', 'Distribution'],
  },
  'matplotlib-visualization': {
    name: 'Matplotlib',
    category: 'Python',
    keywords: ['plt.subplots', 'Axes', 'Figure', 'Histogram', 'Scatter Plot', 'Exporting'],
  },
  'seaborn-statistical-viz': {
    name: 'Seaborn',
    category: 'Python',
    keywords: ['Heatmap', 'Pairplot', 'Violin Plot', 'sns.set_theme', 'FacetGrid', 'Catplot'],
  },
  'data-viz-python': {
    name: 'Data Visualization with Python',
    category: 'Data Analytics',
    keywords: ['Plotly', 'Interactive Dashboards', 'Color Palettes', 'Chart Selection', 'Storytelling'],
  },
  'advanced-sql': {
    name: 'Advanced SQL',
    category: 'SQL & Databases',
    keywords: ['Window Functions', 'ROW_NUMBER', 'CTE', 'PARTITION BY', 'Stored Procedures', 'Indexing'],
  },
  'mysql-database': {
    name: 'MySQL',
    category: 'SQL & Databases',
    keywords: ['InnoDB', 'Transactions', 'ACID', 'Triggers', 'Foreign Keys', 'Indexes'],
  },
  'postgresql-database': {
    name: 'PostgreSQL',
    category: 'SQL & Databases',
    keywords: ['JSONB', 'Extensions', 'Vacuum', 'EXPLAIN ANALYZE', 'Full Text Search', 'Tablespaces'],
  },
  'database-design': {
    name: 'Database Design',
    category: 'SQL & Databases',
    keywords: ['ERD', 'Normalization', '1NF 2NF 3NF', 'Composite Keys', 'Relational Schema'],
  },
  'power-query-etl': {
    name: 'Power Query',
    category: 'Power BI',
    keywords: ['M Language', 'Unpivot Columns', 'ETL Pipeline', 'Merge Queries', 'Append Queries'],
  },
  'power-bi-mastery': {
    name: 'Power BI',
    category: 'Power BI',
    keywords: ['Star Schema', 'Calculated Columns', 'Power BI Service', 'RLS', 'Relationships'],
  },
  'dax-for-power-bi': {
    name: 'DAX for Power BI',
    category: 'Power BI',
    keywords: ['CALCULATE', 'FILTER', 'Evaluation Context', 'Row Context', 'Time Intelligence', 'SAMEPERIODLASTYEAR'],
  },
  'business-intelligence': {
    name: 'Business Intelligence',
    category: 'Data Analytics',
    keywords: ['KPIs', 'Data Governance', 'Executive Dashboards', 'Data Warehousing', 'Decision Support'],
  },
  'ml-fundamentals': {
    name: 'Machine Learning Fundamentals',
    category: 'Machine Learning',
    keywords: ['Train Test Split', 'Overfitting', 'Underfitting', 'Bias-Variance', 'Cross-Validation'],
  },
  'supervised-learning': {
    name: 'Supervised Learning',
    category: 'Machine Learning',
    keywords: ['Labeled Data', 'Random Forest', 'SVM', 'Gradient Boosting', 'Cost Function'],
  },
  'unsupervised-learning': {
    name: 'Unsupervised Learning',
    category: 'Machine Learning',
    keywords: ['PCA', 't-SNE', 'Clustering', 'Dimensionality Reduction', 'Association Rules'],
  },
  'regression-analysis': {
    name: 'Regression',
    category: 'Machine Learning',
    keywords: ['Linear Regression', 'R-Squared', 'RMSE', 'Lasso L1', 'Ridge L2', 'Residuals'],
  },
  'classification-models': {
    name: 'Classification',
    category: 'Machine Learning',
    keywords: ['Logistic Regression', 'ROC-AUC', 'Confusion Matrix', 'Precision', 'Recall', 'F1-Score'],
  },
  'clustering-algorithms': {
    name: 'Clustering',
    category: 'Machine Learning',
    keywords: ['K-Means', 'Elbow Method', 'Silhouette Score', 'DBSCAN', 'Hierarchical Clustering'],
  },
  'feature-engineering': {
    name: 'Feature Engineering',
    category: 'Machine Learning',
    keywords: ['One-Hot Encoding', 'Target Encoding', 'StandardScaler', 'MinMaxScaler', 'Interaction Terms'],
  },
  'feature-selection': {
    name: 'Feature Selection',
    category: 'Machine Learning',
    keywords: ['RFE', 'VarianceThreshold', 'Feature Importance', 'Correlation Filter', 'L1 Regularization'],
  },
  'model-evaluation': {
    name: 'Model Evaluation',
    category: 'Machine Learning',
    keywords: ['Stratified K-Fold', 'Cross-Validation', 'Log Loss', 'Hyperparameter Tuning', 'GridSearchCV'],
  },
  'scikit-learn-mastery': {
    name: 'Scikit-learn',
    category: 'Machine Learning',
    keywords: ['Pipeline', 'ColumnTransformer', 'fit_transform', 'GridSearchCV', 'BaseEstimator'],
  },
  'deep-learning-mastery': {
    name: 'Deep Learning',
    category: 'Artificial Intelligence',
    keywords: ['Backpropagation', 'Activation Functions', 'ReLU', 'Loss Function', 'Adam Optimizer'],
  },
  'neural-networks-architecture': {
    name: 'Neural Networks',
    category: 'Artificial Intelligence',
    keywords: ['Batch Normalization', 'Dropout', 'Weight Initialization', 'Learning Rate', 'Layers'],
  },
  'natural-language-processing': {
    name: 'Natural Language Processing (NLP)',
    category: 'Artificial Intelligence',
    keywords: ['Tokenization', 'TF-IDF', 'Word2Vec', 'Transformers', 'Self-Attention', 'BERT'],
  },
  'computer-vision-ai': {
    name: 'Computer Vision',
    category: 'Artificial Intelligence',
    keywords: ['CNNs', 'Convolution Kernel', 'Pooling', 'ResNet', 'Transfer Learning', 'YOLO'],
  },
  'time-series-analysis': {
    name: 'Time Series Analysis',
    category: 'Data Science',
    keywords: ['Stationarity', 'ADF Test', 'Autocorrelation ACF', 'ARIMA', 'Seasonality', 'Differencing'],
  },
  'recommender-systems': {
    name: 'Recommender Systems',
    category: 'Data Science',
    keywords: ['Collaborative Filtering', 'Matrix Factorization', 'Cosine Similarity', 'Cold Start', 'SVD'],
  },
  'generative-ai-mastery': {
    name: 'Generative AI',
    category: 'Artificial Intelligence',
    keywords: ['Diffusion Models', 'VAEs', 'Prompt Engineering', 'Latent Space', 'Sampling Temperature'],
  },
  'llm-large-language-models': {
    name: 'Large Language Models (LLMs)',
    category: 'Artificial Intelligence',
    keywords: ['Transformer Attention', 'RAG', 'Vector Database', 'Fine-Tuning', 'LoRA', 'Tokens'],
  },
  'real-world-ds-projects': {
    name: 'Real-World Data Science Projects',
    category: 'Data Science',
    keywords: ['End-to-End Pipeline', 'Model Serving', 'Business KPIs', 'Data Drift', 'Monitoring'],
  },
  'ds-portfolio-building': {
    name: 'Data Science Portfolio Building',
    category: 'Career & Freelancing',
    keywords: ['GitHub README', 'Streamlit Apps', 'Interactive Demos', 'Documentation', 'Case Studies'],
  },
  'git-github-data-scientists': {
    name: 'Git & GitHub for Data Scientists',
    category: 'Programming',
    keywords: ['git commit', 'git branch', 'Pull Requests', 'Merge Conflicts', 'DVC', '.gitignore'],
  },
  'kaggle-for-data-science': {
    name: 'Kaggle for Data Science',
    category: 'Data Science',
    keywords: ['Ensembling', 'Cross-Validation Setup', 'Feature Stacking', 'Leakage Prevention', 'Kernels'],
  },
  'ds-interview-prep': {
    name: 'Data Science Interview Preparation',
    category: 'Career & Freelancing',
    keywords: ['System Design', 'Behavioral STAR', 'SQL Live Coding', 'Probability Riddles', 'ML Math'],
  },
  'freelancing-data-scientists': {
    name: 'Freelancing for Data Scientists',
    category: 'Career & Freelancing',
    keywords: ['Client Proposals', 'Value-Based Pricing', 'Scope of Work', 'Milestone Delivery', 'Upwork'],
  },
};

/**
 * Builds a deterministic, rigorous set of exactly 50 MCQs for any course
 */
export const generateCourse50Questions = (courseId: string, courseTitle: string): QuizQuestion[] => {
  const cleanTitle = courseTitle.replace(/^\d+\.\s*/, '');
  const blueprint = COURSE_TOPIC_TEMPLATES[courseId] || {
    name: cleanTitle,
    category: 'Technology',
    keywords: ['Core Principles', 'Architecture', 'Best Practices', 'Optimization', 'Troubleshooting'],
  };

  const questions: QuizQuestion[] = [];
  const domain = blueprint.name || cleanTitle;
  const kw = blueprint.keywords && blueprint.keywords.length > 0 ? blueprint.keywords : ['Methods', 'Syntax', 'Pipelines', 'Models', 'Analysis'];

  // -------------------------------------------------------------
  // EASY LEVEL: Questions 1 to 15 (Fundamentals & Core Terminology)
  // -------------------------------------------------------------
  const easyTemplates = [
    {
      q: `What is the primary definition and core purpose of ${domain}?`,
      opts: [
        `It provides structured principles and systematic methodology for solving problems in ${domain}.`,
        'It is an obsolete manual calculation method with no practical relevance.',
        'It is exclusively designed to replace all database hardware.',
        'It is only used for temporary file format conversions.',
      ],
      ans: 0,
      exp: `${domain} focuses on structured, reproducible workflows and scientific methodology to extract value and build robust solutions.`,
    },
    {
      q: `Which foundational concept is most critical when beginning with ${domain}?`,
      opts: [
        'Ignoring data documentation and assuming default schemas',
        `Understanding ${kw[0] || 'fundamental building blocks'} and systematic execution steps`,
        'Skipping validation and jumping immediately to final presentation',
        'Using hardcoded constants instead of parameterized variables',
      ],
      ans: 1,
      exp: `Mastering ${kw[0] || 'foundational building blocks'} ensures an accurate conceptual baseline and prevents cascading downstream errors.`,
    },
    {
      q: `In the context of ${domain}, what is the main objective of ${kw[1] || 'structured workflows'}?`,
      opts: [
        'To slow down execution times intentionally',
        `To ensure predictable, clean, and verifiable processing throughout the lifecycle`,
        'To bypass all error logging mechanisms',
        'To create single-use code that cannot be reused',
      ],
      ans: 1,
      exp: `Structured workflows guarantee that transformations and logic can be validated, debugged, and maintained in production.`,
    },
    {
      q: `Which of the following is considered a standard best practice in ${domain}?`,
      opts: [
        'Never commenting or documenting key architectural decisions',
        'Hardcoding passwords and API keys directly into public repositories',
        `Consistent naming conventions, rigorous data validation, and modular structure`,
        'Overwriting source data without creating backups or version snapshots',
      ],
      ans: 2,
      exp: 'Validation, consistent naming, and modularity are cornerstone industry standards for reliable engineering.',
    },
    {
      q: `What role does ${kw[2] || 'validation'} play in ${domain}?`,
      opts: [
        'It is an optional step that should only be performed after deployment failure',
        `It verifies assumptions, confirms data integrity, and catches anomalies early`,
        'It encrypts datasets irreversibly so no user can inspect them',
        'It reduces test coverage to minimize development time',
      ],
      ans: 1,
      exp: `Early validation catches errors before they corrupt analytical results or machine learning pipelines.`,
    },
    {
      q: `What is a common indicator of a well-designed solution in ${domain}?`,
      opts: [
        'High complexity that is impossible for other engineers to understand',
        `High reproducibility, clear documentation, and efficient resource utilization`,
        'Extreme memory leakage during basic operations',
        'Total lack of unit tests or validation checks',
      ],
      ans: 1,
      exp: 'Reproducibility and maintainability represent high craftsmanship and production readiness.',
    },
    {
      q: `When working with ${domain}, how should unexpected inputs or edge cases be handled?`,
      opts: [
        `Explicit error handling, logging, and graceful fallback mechanisms`,
        'Ignoring errors silently and continuing execution blindly',
        'Terminating the entire operating system without warning',
        'Deleting the underlying database table automatically',
      ],
      ans: 0,
      exp: 'Explicit exception handling prevents silent corruption and facilitates rapid troubleshooting.',
    },
    {
      q: `Which tool or environment is widely recommended for hands-on experimentation in ${domain}?`,
      opts: [
        'A closed proprietary text viewer without script execution capabilities',
        `Interactive computing environments (such as Jupyter Notebooks, IDEs, or dedicated consoles)`,
        'Unformatted plain text files without syntax highlighting',
        'Directly editing production databases without sandbox testing',
      ],
      ans: 1,
      exp: 'Interactive environments enable immediate feedback, iterative debugging, and rich visual output.',
    },
    {
      q: `What is the primary benefit of vectorization and vectorized operations in ${domain}?`,
      opts: [
        `Executing operations across entire arrays in optimized low-level code without explicit slow loops`,
        'Increasing runtime overhead to consume unused processor capacity',
        'Restricting data processing to one single row per day',
        'Preventing parallel computation on multi-core CPUs',
      ],
      ans: 0,
      exp: 'Vectorization leverages compiled SIMD instructions, yielding massive performance gains over interpreted loops.',
    },
    {
      q: `In ${domain}, why is understanding data types (int, float, string, categorical) essential?`,
      opts: [
        'Data types have no effect on memory usage or mathematical validity',
        `Different types determine allowable operations, memory efficiency, and calculation accuracy`,
        'All modern frameworks treat text and numbers identically without distinction',
        'Data types are only relevant for graphics rendering',
      ],
      ans: 1,
      exp: 'Selecting appropriate data types prevents precision loss, enables mathematical functions, and optimizes RAM usage.',
    },
    {
      q: `What does the term "Immutability" refer to in modern programming and data structures?`,
      opts: [
        'An object whose state cannot be modified after it is created',
        'A variable that changes its value randomly every microsecond',
        'A database table that deletes itself after being read once',
        'A function that takes zero arguments and returns nothing',
      ],
      ans: 0,
      exp: 'Immutable data structures eliminate side effects and make concurrent operations safer.',
    },
    {
      q: `Which metric is most fundamental when assessing the initial distribution of numerical data in ${domain}?`,
      opts: [
        'The length of the variable name in characters',
        `Measures of central tendency (Mean, Median) and dispersion (Standard Deviation, IQR)`,
        'The date when the operating system was installed',
        'The screen resolution of the developer workstation',
      ],
      ans: 1,
      exp: 'Central tendency and spread provide immediate insight into skewness, outliers, and baseline distributions.',
    },
    {
      q: `What is the significance of the DRY principle in ${domain}?`,
      opts: [
        'Deploy Rarely Yearly',
        `"Don't Repeat Yourself" — reducing code duplication through functions and reusable modules`,
        'Data Relational Yield',
        'Delete Residual Yields',
      ],
      ans: 1,
      exp: 'DRY promotes modularity, easier maintenance, and single sources of truth.',
    },
    {
      q: `When sharing code or artifacts in ${domain}, what is the purpose of a README file?`,
      opts: [
        `To explain project purpose, setup instructions, dependencies, and usage examples clearly`,
        'To store private encryption keys in plaintext',
        'To replace the codebase with a single markdown paragraph',
        'To disable automated continuous integration testing',
      ],
      ans: 0,
      exp: 'A comprehensive README allows collaborators and reviewers to understand and run the project reliably.',
    },
    {
      q: `Why is version control (e.g. Git) universally required for ${domain}?`,
      opts: [
        'To lock files so no other developer can ever view them',
        `To track historical changes, collaborate seamlessly, and roll back regressions safely`,
        'To compress source code into unreadable binary formats',
        'To force manual copy-pasting of files with timestamps',
      ],
      ans: 1,
      exp: 'Version control ensures collaborative safety, auditable change logs, and streamlined releases.',
    },
  ];

  // -----------------------------------------------------------------
  // MEDIUM LEVEL: Questions 16 to 35 (Practices, Workflows & Logic)
  // -----------------------------------------------------------------
  const mediumTemplates = [
    {
      q: `When applying ${kw[0] || 'core techniques'} in a practical project, what is the first critical step?`,
      opts: [
        'Deploying untested code directly into production',
        `Formulating clear objectives, exploring inputs, and establishing validation baselines`,
        'Deleting all intermediate logging and telemetry',
        'Hardcoding expected outputs to guarantee 100% test passing',
      ],
      ans: 1,
      exp: 'Clear objectives and exploratory baselines ensure your implementation solves the actual domain problem.',
    },
    {
      q: `How should missing or null values typically be handled in ${domain}?`,
      opts: [
        'Always replacing every null with zero without assessing context',
        `Analyzing the missingness mechanism (MCAR, MAR, MNAR) and applying domain-appropriate imputation or removal`,
        'Ignoring nulls and allowing calculation errors to propagate',
        'Duplicating random rows until no nulls exist',
      ],
      ans: 1,
      exp: 'Appropriate handling depends on why data is missing; naive imputation can introduce severe bias.',
    },
    {
      q: `What is the primary hazard of Data Leakage in ${domain}?`,
      opts: [
        'A physical leak of liquid cooling inside data center servers',
        `Inadvertently sharing information from the test/validation set with the training pipeline, leading to overly optimistic results`,
        'Compressing files until they lose binary bytes',
        'Using open-source packages without a paid license',
      ],
      ans: 1,
      exp: 'Data leakage creates models or analytics that appear flawless during testing but fail catastrophically in production.',
    },
    {
      q: `In ${domain}, what is the distinction between Correlation and Causation?`,
      opts: [
        'They are mathematically identical terms with no difference',
        `Correlation indicates a statistical association, while causation implies that changes in one variable directly produce changes in another`,
        'Causation only applies to text data, while correlation only applies to images',
        'Correlation is always negative, while causation is always positive',
      ],
      ans: 1,
      exp: 'Confounding variables can cause strong correlations without any causal mechanism existing.',
    },
    {
      q: `When tuning hyperparameters in ${domain}, what is the main purpose of K-Fold Cross-Validation?`,
      opts: [
        `Evaluating generalization performance reliably across K distinct partitions to prevent overfitting to a single split`,
        'Speeding up computation by deleting 90% of available data',
        'Ensuring that every model outputs identical predictions',
        'Eliminating the need for a separate final holdout test set',
      ],
      ans: 0,
      exp: 'K-Fold cross-validation provides an unbiased estimate of out-of-sample performance.',
    },
    {
      q: `What is the primary risk of multicollinearity among input features in ${domain}?`,
      opts: [
        'It causes the computer screen to invert colors',
        `It inflates the variance of coefficient estimates, making individual feature interpretations unstable`,
        'It converts all numbers to complex imaginary values',
        'It guarantees that model accuracy drops to exactly zero',
      ],
      ans: 1,
      exp: 'High collinearity obscures the unique contribution of correlated variables.',
    },
    {
      q: `Why is feature scaling (e.g. Standardization or Min-Max normalization) crucial for distance-based algorithms?`,
      opts: [
        'It makes the code run in dark mode',
        `It prevents features with larger numerical ranges from disproportionately dominating Euclidean distance calculations`,
        'It converts non-linear relationships into pure linear lines',
        'It removes all noise and outliers automatically',
      ],
      ans: 1,
      exp: 'Features with large magnitudes would otherwise overpower smaller scale features in distance computations.',
    },
    {
      q: `In ${domain}, what does the Bias-Variance Tradeoff describe?`,
      opts: [
        'The financial cost difference between cloud CPU and GPU instances',
        `The balance between underfitting (high bias, overly simplistic assumptions) and overfitting (high variance, excessive sensitivity to training noise)`,
        'The trade-off between writing docstrings and writing test cases',
        'The speed difference between USB 2.0 and USB 3.0',
      ],
      ans: 1,
      exp: 'Optimal models strike an equilibrium where total generalization error is minimized.',
    },
    {
      q: `When working with high-cardinality categorical variables, which technique is most effective?`,
      opts: [
        'One-hot encoding every category into 500,000 sparse columns without dimensionality management',
        `Target encoding, frequency encoding, or grouping rare categories into an "Other" bucket`,
        'Deleting the categorical column immediately without review',
        'Replacing all strings with random integers',
      ],
      ans: 1,
      exp: 'Target or frequency encoding prevents the curse of dimensionality caused by excessive one-hot columns.',
    },
    {
      q: `What is the fundamental benefit of using pipelines (e.g. Scikit-learn Pipeline or ETL Pipelines) in ${domain}?`,
      opts: [
        `Encapsulating all transformation and modeling steps into an atomic workflow, preventing data leakage and ensuring reproducible execution`,
        'Allowing developers to skip unit testing completely',
        'Automatically translating Python scripts into C++ source files',
        'Increasing disk storage requirements exponentially',
      ],
      ans: 0,
      exp: 'Pipelines ensure that feature transformations learned on training folds are applied identically to test data.',
    },
    {
      q: `How does an Outlier affect the Mean versus the Median of a dataset?`,
      opts: [
        'Outliers affect neither the Mean nor the Median',
        `The Mean is sensitive to extreme values, whereas the Median is robust and resistant to outliers`,
        'The Median changes dramatically, while the Mean remains completely invariant',
        'Outliers only affect the Median if the dataset size is even',
      ],
      ans: 1,
      exp: 'Median represents the positional 50th percentile, shielding it from extreme numerical outliers.',
    },
    {
      q: `In ${domain}, what is the purpose of regular expression (regex) patterns?`,
      opts: [
        'To compile machine code into quantum circuits',
        `To search, match, extract, and manipulate complex text strings using concise pattern syntax`,
        'To compress database tables into ZIP archives',
        'To encrypt user passwords using one-way hashes',
      ],
      ans: 1,
      exp: 'Regex is indispensable for string cleaning, log parsing, and data validation.',
    },
    {
      q: `What is the role of continuous integration (CI) in a modern ${domain} workflow?`,
      opts: [
        `Automatically building, testing, and validating code whenever changes are committed to the repository`,
        'Automatically approving all pull requests without review',
        'Preventing developers from writing unit tests',
        'Sending random spam emails to project contributors',
      ],
      ans: 0,
      exp: 'CI catches breaking changes, syntax errors, and regressions before code merges into production.',
    },
    {
      q: `When interpreting a Confusion Matrix for binary classification, what does a "False Positive" represent?`,
      opts: [
        'A negative instance correctly identified as negative',
        `A negative instance incorrectly predicted as positive (Type I Error)`,
        'A positive instance correctly predicted as positive',
        'A positive instance incorrectly predicted as negative (Type II Error)',
      ],
      ans: 1,
      exp: 'A False Positive (Type I error) is an alarm raised when no actual condition exists.',
    },
    {
      q: `What is the key advantage of Tree-based Ensemble methods (like Random Forest or XGBoost) over a single decision tree?`,
      opts: [
        `Combining multiple weak learners reduces variance and significantly improves prediction stability and accuracy`,
        'They execute in exactly zero milliseconds regardless of data volume',
        'They require zero training data',
        'They eliminate the need for hyperparameter selection',
      ],
      ans: 0,
      exp: 'Ensembling aggregates predictions across diverse trees, smoothing individual tree errors.',
    },
    {
      q: `Why is an ROC-AUC curve often preferred over simple Accuracy for imbalanced datasets?`,
      opts: [
        'Accuracy is only calculated on Tuesdays',
        `Accuracy can be misleadingly high if a model simply predicts the majority class, whereas ROC-AUC evaluates discrimination threshold performance`,
        'ROC-AUC cannot be calculated if accuracy is greater than 50%',
        'ROC-AUC is strictly a measure of execution speed',
      ],
      ans: 1,
      exp: 'In a 99:1 imbalanced dataset, a trivial model predicting all negative achieves 99% accuracy but zero diagnostic utility.',
    },
    {
      q: `What is the primary purpose of Dimensionality Reduction techniques (such as PCA)?`,
      opts: [
        `Transforming high-dimensional data into a lower-dimensional representation while preserving maximum variance and reducing computational cost`,
        'Multiplying the number of columns by 100 to maximize complexity',
        'Converting numerical tables into audio waveforms',
        'Removing all variance and rendering the data constant',
      ],
      ans: 0,
      exp: 'PCA projects features along orthogonal eigenvectors of greatest variance, mitigating the curse of dimensionality.',
    },
    {
      q: `In ${domain}, what is the significance of the p-value in hypothesis testing?`,
      opts: [
        'The probability that the researcher is 100% correct',
        `The probability of observing results at least as extreme as the sample, assuming the null hypothesis is true`,
        'The percentage of missing records in the database',
        'The speed of the network connection during calculation',
      ],
      ans: 1,
      exp: 'A p-value below alpha (typically 0.05) provides evidence against the null hypothesis.',
    },
    {
      q: `Which technique is most effective for preventing overfitting when training complex models in ${domain}?`,
      opts: [
        'Training on the exact same 10 data points for 1,000,000 epochs',
        `Applying regularization (L1/L2), dropout, early stopping, and acquiring more representative training samples`,
        'Removing all validation checks and testing on the training set',
        'Increasing model capacity infinitely without regularization',
      ],
      ans: 1,
      exp: 'Regularization penalizes overly complex weights, constraining the model to learn generalizable patterns.',
    },
    {
      q: `What is the primary purpose of Exploratory Data Analysis (EDA) before modeling?`,
      opts: [
        'To generate decorative visual slides without analyzing numbers',
        `To discover underlying patterns, test initial assumptions, detect anomalies, and inform feature engineering choices`,
        'To overwrite the raw database permanently',
        'To bypass data governance regulations',
      ],
      ans: 1,
      exp: 'Thorough EDA exposes structural errors, skewness, and relationships that dictate modeling strategy.',
    },
  ];

  // -----------------------------------------------------------------
  // ADVANCED LEVEL: Questions 36 to 50 (Optimization, Deep Architecture)
  // -----------------------------------------------------------------
  const advancedTemplates = [
    {
      q: `In high-performance systems for ${domain}, how does memory locality impact cache efficiency?`,
      opts: [
        'Memory locality is irrelevant on modern multi-core x86 and ARM processors',
        `Contiguous memory layouts (C-contiguous arrays) maximize CPU L1/L2 cache line hits and minimize RAM latency`,
        'Storing array elements at random memory addresses speeds up pointer dereferencing',
        'Virtual memory paging eliminates the need for CPU cache architectures',
      ],
      ans: 1,
      exp: 'Spatial locality allows CPU prefetchers to load sequential blocks into L1/L2 caches ahead of execution.',
    },
    {
      q: `What is the mathematical mechanism behind Gradient Descent optimization in ${domain}?`,
      opts: [
        'Incrementing parameters in the exact direction of the steepest ascent of the loss function',
        `Iteratively updating parameters in the negative direction of the gradient of the loss function with respect to those parameters`,
        'Setting all weights to random uniform noise at every epoch',
        'Computing the matrix determinant and setting it equal to zero',
      ],
      ans: 1,
      exp: 'The negative gradient points in the direction of steepest decrease on the loss surface.',
    },
    {
      q: `What is the mathematical difference between L1 (Lasso) and L2 (Ridge) Regularization?`,
      opts: [
        'L1 adds the squared sum of weights, while L2 adds the absolute sum of weights',
        `L1 adds the sum of absolute weight values (producing sparse solutions with exact zeros), while L2 adds the sum of squared weights (shrinking weights proportionally)`,
        'L1 can only be used on integers, while L2 can only be used on floating-point numbers',
        'L1 and L2 are mathematically identical in all dimensions',
      ],
      ans: 1,
      exp: 'L1 geometric contours intersect axes at corners, driving non-essential coefficients to exactly zero (feature selection).',
    },
    {
      q: `When dealing with severe Class Imbalance in classification pipelines, which advanced strategy is most robust?`,
      opts: [
        'Ignoring the minority class entirely and reporting 99.9% majority accuracy',
        `Using Cost-Sensitive Learning (class weighting), Focal Loss, or calibrated threshold optimization on Precision-Recall curves`,
        'Duplicating a single minority row 1,000,000 times without noise injection',
        'Inverting all target labels randomly before training',
      ],
      ans: 1,
      exp: 'Cost-sensitive learning and focal loss dynamically scale the gradient updates for rare hard examples.',
    },
    {
      q: `In modern Neural Network architectures, why did ReLU largely supersede Sigmoid as the standard hidden layer activation function?`,
      opts: [
        'ReLU is computationally slower but produces artistic outputs',
        `ReLU prevents the vanishing gradient problem for positive inputs and enables significantly faster gradient propagation and computation`,
        'Sigmoid outputs values between negative infinity and positive infinity',
        'ReLU requires complex trigonometric calculations on GPUs',
      ],
      ans: 1,
      exp: 'Sigmoid saturates at both tails with near-zero derivatives, causing gradients to vanish during deep backpropagation.',
    },
    {
      q: `What is the role of Batch Normalization in deep neural architectures for ${domain}?`,
      opts: [
        `Normalizing layer inputs across mini-batches to stabilize internal covariate shift, allowing higher learning rates and faster convergence`,
        'Deleting half of the network weights at every iteration',
        'Restricting the batch size strictly to 1 sample per epoch',
        'Converting floating point weights to 8-bit ASCII characters',
      ],
      ans: 0,
      exp: 'Batch normalization smooths the optimization landscape, preventing exploding or vanishing activations.',
    },
    {
      q: `In Transformer architectures, what is the core mathematical mechanism of Scaled Dot-Product Self-Attention?`,
      opts: [
        'Convolving adjacent pixels with a 3x3 Gaussian blur filter',
        `Computing Softmax((Q * K^T) / sqrt(d_k)) * V, calculating dynamic relationship weights across all token pairs regardless of distance`,
        'Sorting words alphabetically before executing linear regression',
        'Hashing input tokens into fixed 32-bit integer buckets',
      ],
      ans: 1,
      exp: 'Scaled dot-product attention computes all-to-all sequence dependencies in parallel without recurrent bottleneck.',
    },
    {
      q: `What causes the "Curse of Dimensionality" in high-dimensional feature spaces?`,
      opts: [
        'Hard drive sectors physically breaking down under large files',
        `Exponential volume growth makes data points extremely sparse, causing distance metrics to converge toward uniform values and degrading clustering/classification`,
        'Algorithms running out of color palettes for 2D charts',
        'Variable names exceeding 255 characters in length',
      ],
      ans: 1,
      exp: 'In high dimensions, the distance between any two points approaches the distance to all points, diluting neighborhood signals.',
    },
    {
      q: `What is the purpose of Early Stopping during iterative model training?`,
      opts: [
        `Monitoring performance on a separate validation set and halting training when validation loss stops improving, preventing overfitting`,
        'Stopping training after exactly 10 seconds regardless of progress',
        'Halting the Python process whenever an exception occurs',
        'Terminating training only when training accuracy reaches 100%',
      ],
      ans: 0,
      exp: 'Early stopping preserves the model checkpoint at the peak of out-of-sample generalization.',
    },
    {
      q: `In SQL query optimization for relational databases, what does an "Index Scan" versus a "Sequential (Full Table) Scan" signify?`,
      opts: [
        'An Index Scan reads every block on disk from start to finish',
        `An Index Scan traverses a B-Tree structure to access specific matching rows rapidly, while a Sequential Scan reads all table pages sequentially`,
        'Sequential scans are always 1,000 times faster than index scans on multi-gigabyte tables',
        'Index scans are only possible on non-relational document stores',
      ],
      ans: 1,
      exp: 'B-Tree indexes provide logarithmic O(log N) lookup times, bypassing expensive full-disk scans for selective filters.',
    },
    {
      q: `In distributed systems for ${domain}, what does the CAP Theorem state?`,
      opts: [
        'Compute, Access, and Performance can all be 100% maximized concurrently without tradeoffs',
        `A distributed data store can guarantee at most two out of three properties simultaneously: Consistency, Availability, and Partition Tolerance`,
        'Code, Architecture, and Pricing must be equal across all cloud providers',
        'Continuous Integration, Automated Testing, and Production Releases require 3 servers',
      ],
      ans: 1,
      exp: 'Network partitions are inevitable; distributed systems must choose between consistency (CP) or availability (AP).',
    },
    {
      q: `What is the role of the Softmax function in multi-class classification output layers?`,
      opts: [
        'It rounds all numbers to the nearest integer',
        `It transforms an unnormalized vector of raw logits into a normalized probability distribution where all elements sum to exactly 1.0`,
        'It inverts the matrix eigenvalues to reduce computational memory',
        'It sets the smallest logit to 100 and all others to 0',
      ],
      ans: 1,
      exp: 'Softmax exponentiates logits and divides by their sum, yielding mathematically valid class probabilities.',
    },
    {
      q: `In ${domain}, what is the key advantage of Asynchronous I/O over synchronous blocking calls?`,
      opts: [
        `The event loop continues executing other concurrent tasks while waiting for I/O operations (network, disk, database) to complete`,
        'It executes synchronous code 10 times faster on a single thread without an event loop',
        'It disables all garbage collection overhead permanently',
        'It prevents network requests from ever timing out',
      ],
      ans: 0,
      exp: 'Async I/O prevents threads from idling on external latency, enabling high concurrency and throughput.',
    },
    {
      q: `What is the significance of the Adam Optimizer compared to standard Stochastic Gradient Descent (SGD)?`,
      opts: [
        'Adam only works on linear models with 2 features',
        `Adam computes adaptive learning rates for each parameter by maintaining exponentially decaying moving averages of past gradients and squared gradients`,
        'Adam completely eliminates the need for computing partial derivatives',
        'Adam is a hardware accelerator chip installed on motherboards',
      ],
      ans: 1,
      exp: 'Adam combines the advantages of AdaGrad (frequent vs rare parameter scaling) and RMSProp (momentum across recent gradients).',
    },
    {
      q: `What is the ultimate engineering criterion for deploying a production-ready model or system in ${domain}?`,
      opts: [
        'Achieving 100% training accuracy regardless of test validation or infrastructure cost',
        `Verifiable out-of-sample performance, robust error boundaries, low inference latency, comprehensive monitoring for data/concept drift, and clear business alignment`,
        'Writing code with zero documentation so it cannot be altered by others',
        'Running models strictly on local development laptops without automated health checks',
      ],
      ans: 1,
      exp: 'Production readiness demands end-to-end reliability, drift observability, latency SLAs, and proven business value.',
    },
  ];

  let qIndex = 1;

  // Add Easy 1-15
  easyTemplates.slice(0, 15).forEach((t) => {
    questions.push({
      id: `${courseId}-q-${qIndex}`,
      questionNumber: qIndex,
      question: t.q,
      options: t.opts,
      correctAnswer: t.ans,
      explanation: t.exp,
      difficulty: 'easy',
      topic: `${domain} Foundations`,
    });
    qIndex++;
  });

  // Add Medium 16-35
  mediumTemplates.slice(0, 20).forEach((t) => {
    questions.push({
      id: `${courseId}-q-${qIndex}`,
      questionNumber: qIndex,
      question: t.q,
      options: t.opts,
      correctAnswer: t.ans,
      explanation: t.exp,
      difficulty: 'medium',
      topic: `${domain} Workflows & Analysis`,
    });
    qIndex++;
  });

  // Add Advanced 36-50
  advancedTemplates.slice(0, 15).forEach((t) => {
    questions.push({
      id: `${courseId}-q-${qIndex}`,
      questionNumber: qIndex,
      question: t.q,
      options: t.opts,
      correctAnswer: t.ans,
      explanation: t.exp,
      difficulty: 'advanced',
      topic: `${domain} Architecture & Optimization`,
    });
    qIndex++;
  });

  return questions;
};
