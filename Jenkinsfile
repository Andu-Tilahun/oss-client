pipeline {
    agent any

    environment {
        GITHUB_CREDS    = credentials('github-ssh-auth-oss-front') 
        REPO_URL        = 'git@github.com:Andu-Tilahun/oss-client.git'
    }

    stages {
        stage('Checkout Source') {
            steps {
                cleanWs() 
                
                // Use the explicit checkout step to force the SSH bypass directly into the Git configuration runtime
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']], 
                    extensions: [[$class: 'CloneOption', noTags: false, reference: '', shallow: false]], 
                    userRemoteConfigs: [[
                        credentialsId: 'github-ssh-auth-oss-front', 
                        url: "${env.REPO_URL}",
                        // This config string directly injects the override down into the underlying Git client execution
                        coreKey: 'ssh -o StrictHostKeyChecking=no'
                    ]]
                ])
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Triggering containerized deployment via DinD sidecar...'
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
