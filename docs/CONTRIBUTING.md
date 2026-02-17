# Contributing Guide

> **We'd love your help making this extension even better!** 🎉

Whether you're fixing a bug, adding a feature, improving documentation, or just sharing ideas - every contribution matters and is greatly appreciated!

## 🌟 Why Contribute?

- **Learn**: Gain hands-on experience with TypeScript, Chrome Extensions API, and modern web development
- **Impact**: Help thousands of developers streamline their API testing workflows
- **Community**: Join a community of developers passionate about developer tools
- **Portfolio**: Build your open-source portfolio with meaningful contributions
- **Recognition**: All contributors are acknowledged in our project

## 🎯 Ways to Contribute

### 🐛 Report Bugs

Found a bug? Help us fix it!

1. **Check existing issues** to avoid duplicates
2. **Use our issue template** for consistent reporting
3. **Provide details**:
   - Browser version and OS
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/GIFs if applicable

[Report a Bug →](https://github.com/williancae/swagger-env-vars/issues/new?template=bug_report.md)

### 💡 Suggest Features

Have an idea to make this extension better?

1. Check if it's already requested in [Discussions](https://github.com/williancae/swagger-env-vars/discussions)
2. Describe the problem you're trying to solve
3. Explain your proposed solution
4. Share use cases and examples

[Suggest a Feature →](https://github.com/williancae/swagger-env-vars/issues/new?template=feature_request.md)

### 📝 Improve Documentation

Documentation is just as important as code!

- Fix typos or unclear explanations
- Add examples and use cases
- Translate to other languages
- Create tutorials or blog posts
- Improve code comments

### 🔧 Submit Code

Ready to get your hands dirty? Awesome!

#### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/williancae/swagger-env-vars.git
   cd swagger-env-vars
   npm install
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**

   - Follow our code standards (see below)
   - Write tests for new features
   - Update documentation
   - Keep commits atomic and well-described

4. **Run quality checks** (all must pass!)

   ```bash
   npm run lint          # Check code style
   npm run type-check    # Verify TypeScript types
   npm test              # Run unit tests
   npm run build         # Ensure it builds
   ```

5. **Commit with Conventional Commits**

   ```bash
   git commit -m "feat: add variable templates feature"
   ```

   **Commit Types:**

   - `feat:` New feature for users
   - `fix:` Bug fix
   - `docs:` Documentation only
   - `style:` Code style (formatting, semicolons, etc.)
   - `refactor:` Code refactoring without feature changes
   - `perf:` Performance improvements
   - `test:` Adding or updating tests
   - `chore:` Build process or auxiliary tool changes

   Learn more: [Conventional Commits](https://www.conventionalcommits.org/)

6. **Push and create a Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

   Then open a PR on GitHub with:
   - Clear title describing the change
   - Description explaining what and why
   - Reference to related issues (if any)
   - Screenshots/GIFs for UI changes

## 📋 Development Guidelines

### Code Standards

- **TypeScript Strict Mode**: All code must pass strict type checking
- **ESLint**: Configured for TypeScript with recommended rules
- **Prettier**: Consistent code formatting (100 char line width, single quotes)
- **Import Paths**: Use `@/` alias for `src/` imports
- **Naming Conventions**:
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

### Quality Requirements

- **Test Coverage**: Aim for >80% coverage on new code
- **Documentation**: Update README and inline docs for new features
- **Browser Compatibility**: Test on Chrome, Edge, and Firefox
- **Performance**: Keep bundle size under 500KB, optimize for speed
- **Accessibility**: Follow WCAG 2.1 AA guidelines
- **Responsiveness**: Ensure UI works on different screen sizes
- **Error Handling**: Handle edge cases gracefully

## 🎨 First-Time Contributors

New to open source? No problem! Here are some good first issues:

- 🏷️ Look for issues labeled [`good first issue`](https://github.com/williancae/swagger-env-vars/labels/good%20first%20issue)
- 📚 Check our documentation
- 💬 Join our [Discussions](https://github.com/williancae/swagger-env-vars/discussions) to ask questions

## 🔍 Code Review Process

1. **All PRs require review** before merging
2. **CI must pass**: linting, type checking, and tests
3. **Maintainers will review** within 2-3 business days
4. **Feedback is collaborative**: we're here to help, not criticize
5. **Iteration is normal**: expect revision requests

## 🏆 Recognition

All contributors are recognized in:

- Our Contributors section
- GitHub's contributor graph
- Release notes for significant contributions

## ❓ Need Help?

Don't hesitate to ask for help!

- 💬 [GitHub Discussions](https://github.com/williancae/swagger-env-vars/discussions) - Q&A and general chat
- 🐛 [Issues](https://github.com/williancae/swagger-env-vars/issues) - Bug reports and feature requests
- 📧 Email: williancaecam@gmail.com

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for taking the time to contribute and help make this tool better for everyone! 💙
