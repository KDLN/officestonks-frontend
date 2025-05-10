# Setting Up GitHub Repository

Follow these steps to push this frontend to a new GitHub repository:

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click the "+" button in the top right corner and select "New repository"
3. Name your repository (e.g., "officestonks-frontend")
4. Leave it as a public repository (or private if you prefer)
5. Do NOT initialize the repository with a README, .gitignore, or license
6. Click "Create repository"

## 2. Push Local Repository to GitHub

After creating the repository, GitHub will show you the commands to push an existing repository. Use the following commands:

```bash
# Make sure you're in the frontend directory
cd /home/kdln/code/officestonks-frontend

# Add the GitHub repository as a remote
git remote add origin https://github.com/YOUR_USERNAME/officestonks-frontend.git

# Rename the master branch to main (recommended)
git branch -M main

# Push the repository to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 3. Set Up GitHub Pages (Optional)

If you want to deploy the frontend using GitHub Pages:

1. Go to the repository settings on GitHub
2. Scroll down to the "GitHub Pages" section
3. Select the "main" branch and the "/build" folder
4. Click "Save"

Your frontend will be available at `https://YOUR_USERNAME.github.io/officestonks-frontend`.

## 4. Set Up Railway Deployment

1. Go to [Railway](https://railway.app/) and sign in
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select the repository you just created
6. Railway will automatically detect the configuration and start the deployment

Your frontend will be available at the URL provided by Railway.