#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error log directory
ERROR_LOG_DIR="scripts/deployment/error_logs"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
ERROR_LOG_FILE="${ERROR_LOG_DIR}/deployment_error_${TIMESTAMP}.txt"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to log error to file
log_error() {
    local error_message="$1"
    local step_name="$2"
    local command_output="$3"
    
    # Create error log directory if it doesn't exist
    mkdir -p "$ERROR_LOG_DIR"
    
    # Write error to log file
    {
        echo "=========================================="
        echo "Deployment Error Log"
        echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Step: $step_name"
        echo "Error: $error_message"
        echo "------------------------------------------"
        if [ -n "$command_output" ]; then
            echo "Command Output:"
            echo "$command_output"
            echo "------------------------------------------"
        fi
        echo "=========================================="
        echo ""
    } >> "$ERROR_LOG_FILE"
    
    print_error "Error logged to: $ERROR_LOG_FILE"
}

# Function to push error log to git
# Returns 0 if successful, 1 if failed
push_error_log() {
    if [ -f "$ERROR_LOG_FILE" ]; then
        print_info "Committing and pushing error log to repository..."
        git add "$ERROR_LOG_FILE" 2>/dev/null
        if [ $? -ne 0 ]; then
            print_warning "Failed to add error log to git"
            return 1
        fi
        
        git commit -m "Add deployment error log - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
        if [ $? -ne 0 ]; then
            print_warning "Failed to commit error log"
            return 1
        fi
        
        git push origin master 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Error log pushed to repository successfully"
            return 0
        else
            print_warning "Failed to push error log to repository"
            return 1
        fi
    else
        print_warning "Error log file not found, skipping push"
        return 1
    fi
}

# Function to prompt user to pull code on local development
prompt_local_pull() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Action Required on Local Development${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${BLUE}An error occurred during deployment. The error log has been pushed to the repository.${NC}"
    echo -e "${BLUE}Please run the following command on your local machine to pull the error log:${NC}"
    echo ""
    echo -e "${GREEN}  git pull origin master${NC}"
    echo ""
    echo -e "${BLUE}Then check the error log file in: ${NC}"
    echo -e "${GREEN}  scripts/deployment/error_logs/${NC}"
    echo ""
    echo -e "${BLUE}Review the error, fix the issue, and redeploy.${NC}"
    echo ""
}

# Function to check if command succeeded
check_error() {
    local exit_code=$?
    local error_message="$1"
    local step_name="$2"
    local command_output="$3"
    
    if [ $exit_code -ne 0 ]; then
        print_error "$error_message"
        log_error "$error_message" "$step_name" "$command_output"
        
        # Push error log to git and only prompt if push was successful
        push_error_log
        PUSH_SUCCESS=$?
        
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}  Deployment Failed!${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        
        # Only prompt user to pull if error log was successfully pushed
        if [ $PUSH_SUCCESS -eq 0 ]; then
            prompt_local_pull
        else
            print_warning "Error log was not pushed to repository. Please check manually."
        fi
        
        exit 1
    fi
}

# Start deployment
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Starting Deployment Process${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Change to the project directory
print_info "Step 1: Changing to project directory..."
if ! cd /home/sugatraj/adysun_hrms 2>&1; then
    CD_OUTPUT="Failed to change to directory /home/sugatraj/adysun_hrms. Directory may not exist or permission denied."
    check_error "Failed to change directory to /home/sugatraj/adysun_hrms" "Step 1: Change Directory" "$CD_OUTPUT"
fi
print_success "Directory changed successfully"
echo ""

# Step 2: Git Fetch
print_info "Step 2: Fetching latest code from repository..."
FETCH_OUTPUT=$(git fetch origin master 2>&1)
FETCH_EXIT_CODE=$?
if [ $FETCH_EXIT_CODE -ne 0 ]; then
    check_error "Failed to fetch from repository" "Step 2: Git Fetch" "$FETCH_OUTPUT"
fi
print_success "Git fetch completed successfully"
echo ""

# Step 3: Git Pull
print_info "Step 3: Pulling latest code from repository..."
PULL_OUTPUT=$(git pull origin master 2>&1)
PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -ne 0 ]; then
    check_error "Failed to pull from repository" "Step 3: Git Pull" "$PULL_OUTPUT"
fi

# Check if output contains "Already up to date"
if echo "$PULL_OUTPUT" | grep -q "Already up to date"; then
    print_warning "Repository is already up to date"
else
    print_success "Code updated successfully"
fi
echo ""

# Step 4: NPM Install
print_info "Step 4: Installing dependencies (npm install)..."
NPM_INSTALL_OUTPUT=$(npm install 2>&1)
NPM_INSTALL_EXIT_CODE=$?
if [ $NPM_INSTALL_EXIT_CODE -ne 0 ]; then
    check_error "Failed to install dependencies" "Step 4: NPM Install" "$NPM_INSTALL_OUTPUT"
fi
print_success "Dependencies installed successfully"
echo ""

# Step 5: NPM CI
print_info "Step 5: Running clean install (npm ci)..."
NPM_CI_OUTPUT=$(npm ci 2>&1)
NPM_CI_EXIT_CODE=$?
if [ $NPM_CI_EXIT_CODE -ne 0 ]; then
    check_error "Failed to run clean install" "Step 5: NPM CI" "$NPM_CI_OUTPUT"
fi
print_success "Clean install completed successfully"
echo ""

# Step 6: NPM Build
print_info "Step 6: Building project (npm run build)..."
NPM_BUILD_OUTPUT=$(npm run build 2>&1)
NPM_BUILD_EXIT_CODE=$?
if [ $NPM_BUILD_EXIT_CODE -ne 0 ]; then
    check_error "Failed to build project" "Step 6: NPM Build" "$NPM_BUILD_OUTPUT"
fi
print_success "Project built successfully"
echo ""

# Step 7: PM2 List (Optional)
print_info "Step 7: Listing PM2 processes..."
PM2_LIST_OUTPUT=$(pm2 list 2>&1)
PM2_LIST_EXIT_CODE=$?
if [ $PM2_LIST_EXIT_CODE -ne 0 ]; then
    print_warning "PM2 list command failed, but continuing..."
else
    print_success "PM2 processes listed"
fi
echo ""

# Step 8: PM2 Restart
print_info "Step 8: Restarting PM2 process 'adysun_hrms'..."
PM2_RESTART_OUTPUT=$(pm2 restart adysun_hrms 2>&1)
PM2_RESTART_EXIT_CODE=$?
if [ $PM2_RESTART_EXIT_CODE -ne 0 ]; then
    check_error "Failed to restart PM2 process" "Step 8: PM2 Restart" "$PM2_RESTART_OUTPUT"
fi
print_success "PM2 process restarted successfully"
echo ""

# Success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
print_success "All steps completed successfully"
exit 0
