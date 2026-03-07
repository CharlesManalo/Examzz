# Contributing to StudyQuiz Pro

Thank you for your interest in contributing to StudyQuiz Pro! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/studyquiz-pro.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m 'Add some feature'`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build
```

## Code Style

- Use TypeScript strict mode
- Follow functional component patterns
- Use hooks for state management
- Add JSDoc comments for functions
- Use meaningful variable names

## Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

## Pull Request Process

1. Update README.md with details of changes if applicable
2. Ensure all tests pass
3. Update version numbers if releasing
4. Request review from maintainers

## Reporting Bugs

Use GitHub Issues with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

## Feature Requests

Open an issue with:
- Clear description
- Use case
- Proposed implementation (optional)

## Questions?

Contact: support@studyquiz.com
