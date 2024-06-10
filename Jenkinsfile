pipeline {
    agent { 
        docker { 
            image 'docker-node'
            reuseNode true
            label 'al-server'
            args '-u 0:0 -v /var/run/docker.sock:/var/run/docker.sock'
        } 
    }

    environment {
        BRANCH_NAME = "${env.BRANCH_NAME}"
    }

    stages {

        stage(' FK: Check Branch and Define Env variables') {
            steps {
                script {
                    if (BRANCH_NAME == 'main') {
						ENV = 'prod'
                        awsRegion = 'us-east-1'
                        key = 'fn-aws-access'
                        timeout(time: 3, unit: 'MINUTES') {
                            input message: 'Approve Deploy?', ok: 'Yes'
                        }
                    } else if (BRANCH_NAME == 'release') {
                        ENV = 'stg'
                        awsRegion = 'us-west-2'
                        key = 'fn-aws-access'
                    } else if (BRANCH_NAME == 'develop') {
                        ENV = 'dev'
                        awsRegion = 'us-east-2'
                        key = 'fn-aws-access'
                    } else {
						echo "MSG Finaktiva: Branch '${BRANCH_NAME}' is not one of main, develop, or release-*"
                        currentBuild.result = 'ABORTED'
                        error "MSG Finaktiva: Pipeline aborted for unsupported branch"
                    }
					echo " FK: Using environment: ${ENV} in branch ${BRANCH_NAME} in Region: ${awsRegion} with key: ${key}"
                    
                    projectName = "${ENV}-pladik-fn"
                    appName = "int-confecamaras"
                    cluster = "app"

                    repoName = "${projectName}-rep-${appName}"
                    serviceName = "${projectName}-app-fg-srv-${appName}"
                    clusterName = "${projectName}-ecs-cluster-${cluster}"
                }
            }
        }

        stage('FK: Build Container Images') {
            steps {
                script {
                    sh "docker build -t ${repoName}:latest ."
                }
            }
        }

        stage('FK: COnfigure ECR Access and get Account ID') {
            steps {
                withAWS(credentials: "${key}", region: "${awsRegion}") {
                    script {
                        //def ACCOUNT_ID = sh(returnStdout: true, script: 'aws sts get-caller-identity --query "Account" --output text').trim()
                        def identity = awsIdentity()
                        env.AWS_ACCOUNT_ID = identity.account
                        env.ECR_REPOSITORY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${awsRegion}.amazonaws.com"

                        sh "aws ecr get-login-password --region ${awsRegion} | docker login -u AWS --password-stdin ${env.ECR_REPOSITORY}"
                    }
                }
            }
        }

        stage('FK: Tag Image to ECR upload ') {
            steps {
                withAWS(credentials: "${key}", region: "${awsRegion}") {
                    script {
                        sh "docker tag ${repoName}:latest ${env.ECR_REPOSITORY}/${repoName}:latest"
                    }
                }
            }
        }

        stage('FK: Upload Images to ECR with docker push') {
            steps {
                withAWS(credentials: "${key}", region: "${awsRegion}") {
                    script {
                        sh "docker push ${env.ECR_REPOSITORY}/${repoName}:latest"
                    }
                }
            }
        }

        stage('FK: Force update ECS service to launch changes in fargate') {
            steps {
                withAWS(credentials: "${key}", region: "${awsRegion}") {
                    script {
                        sh "aws ecs update-service --region ${awsRegion} --cluster ${clusterName} --service ${serviceName} --desired-count 1 --force-new-deployment"
                    }
                }
            }
        }

        stage('FK: Docker clean and remove local images') {
            steps {
                script {
                    sh "docker rmi ${env.ECR_REPOSITORY}/${repoName}"
                    sh "docker rmi ${repoName}"
                }
            }
        }
    }
}