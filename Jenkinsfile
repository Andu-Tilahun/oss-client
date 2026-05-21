pipeline {
    agent any

    environment {
        // 1. Point to your exact, explicit Jenkins Credential ID
        GITHUB_CREDS    = credentials('github-ssh-auth-oss-front') 
        REPO_URL        = 'git@github.com:Andu-Tilahun/oss-client.git'
        
        // 2. Overrides the missing known_hosts file inside the Docker container automatically
        GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=no'
    }

    stages {
        stage('Checkout Source') {
            steps {
                // Wipe the workspace cleanly before pulling fresh code
                cleanWs() 
                
                // Clone the repository using the exact credential ID defined above
                git branch: 'main',
                    credentialsId: 'github-ssh-auth-oss-front',
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
