pipeline {
    agent any

    environment {
        // References the exact credential ID we created in Step 2
        GITHUB_CREDS = credentials('github-ssh-auth') 
        // Ensure this uses the git@github.com: SSH format
        REPO_URL     = 'git@github.com:Andu-Tilahun/oss-client.git'
    }

    stages {
        stage('Checkout Source') {
            steps {
                // Wipe the workspace cleanly before pulling fresh code
                cleanWs() 
                
                // Clone the repository using your SSH deployment key
                git branch: 'main',
                    credentialsId: 'github-ssh-auth',
                    url: "${env.REPO_URL}"
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Triggering containerized deployment via DinD sidecar...'
                
                // Routes commands directly to the host's daemon to re-build your application
                sh 'docker compose down && docker compose up -d --build'
            }
        }
    }

    post {
        success {
            echo 'Deployment pipeline executed and completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please review the console logs above for errors.'
        }
    }
}
