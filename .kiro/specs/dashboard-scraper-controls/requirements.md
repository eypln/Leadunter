# Requirements Document

## Introduction

Phase 9a adds manual scraper controls to the Lead Hunter dashboard, enabling users to trigger scraping jobs on-demand, monitor scraping status, and view job history. This feature extends the existing automated scraper (Phase 8) by providing visibility and manual control through the dashboard UI.

The system currently has:
- Automated scraping via Vercel cron (every 6 hours)
- POST /api/scraper/trigger endpoint (no UI button)
- scraping_jobs database table tracking job execution
- Email notifications for job completion

This feature adds:
- Manual trigger button in dashboard
- Real-time job status display
- Job history table with statistics
- User feedback via toast notifications

## Glossary

- **Dashboard**: The main authenticated user interface displaying leads and statistics
- **Scraper**: The Apify-based cloud service that extracts rental listings from Facebook
- **Scraping_Job**: A database record tracking a single scraper execution with metadata
- **Job_History**: The chronological list of past scraping jobs with their results
- **Trigger_Button**: The UI control that initiates an on-demand scraping job
- **Status_Display**: The UI component showing the most recent scraping job status
- **Toast_Notification**: A temporary popup message providing user feedback
- **API_Client**: The frontend service that communicates with backend API routes
- **Job_Statistics**: Metrics about a scraping job (leads found, duration, owner/client breakdown)

## Requirements

### Requirement 1: Manual Scraper Trigger

**User Story:** As a real estate specialist, I want to trigger a scraping job manually from the dashboard, so that I can get fresh leads on-demand without waiting for the scheduled cron job.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Trigger Scrape" button prominently in the main view
2. WHEN the user clicks the "Trigger Scrape" button, THE API_Client SHALL send a POST request to /api/scraper/trigger
3. WHEN the API request is in progress, THE Trigger_Button SHALL display a loading state with spinner icon
4. WHEN the API request is in progress, THE Trigger_Button SHALL be disabled to prevent duplicate requests
5. WHEN the scraper starts successfully, THE Toast_Notification SHALL display a success message with the run ID
6. IF the scraper fails to start, THEN THE Toast_Notification SHALL display an error message with failure details
7. WHEN the scraper starts successfully, THE Status_Display SHALL update to show "Running" status
8. THE Trigger_Button SHALL be positioned above the stats cards for high visibility

### Requirement 2: Last Scrape Status Display

**User Story:** As a real estate specialist, I want to see when the last scrape occurred and whether it succeeded, so that I know if my lead data is current.

#### Acceptance Criteria

1. THE Status_Display SHALL show the timestamp of the most recent scraping job
2. THE Status_Display SHALL show the status of the most recent scraping job (PENDING, RUNNING, COMPLETED, FAILED)
3. WHEN the most recent job status is COMPLETED, THE Status_Display SHALL use a green success indicator
4. WHEN the most recent job status is FAILED, THE Status_Display SHALL use a red error indicator
5. WHEN the most recent job status is RUNNING, THE Status_Display SHALL use a blue progress indicator with animated spinner
6. WHEN the most recent job status is PENDING, THE Status_Display SHALL use a yellow pending indicator
7. THE Status_Display SHALL format timestamps as relative time (e.g., "2 hours ago", "Just now")
8. WHEN no scraping jobs exist, THE Status_Display SHALL show "No scrapes yet" message
9. THE Status_Display SHALL refresh automatically every 30 seconds to show updated status

### Requirement 3: Scraping Job History API

**User Story:** As a developer, I want an API endpoint that returns scraping job history, so that the dashboard can display past job results.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/scraper/jobs endpoint
2. WHEN the endpoint receives a request, THE System SHALL query the scraping_jobs table ordered by started_at descending
3. THE System SHALL return the 10 most recent scraping jobs
4. FOR ALL returned jobs, THE System SHALL include id, status, started_at, completed_at, leads_found, run_id, and dataset_id
5. FOR ALL returned jobs, THE System SHALL calculate job duration (completed_at - started_at)
6. THE System SHALL return jobs in JSON format with success flag
7. IF the database query fails, THEN THE System SHALL return an error response with 500 status code
8. THE System SHALL require authentication to access the endpoint

### Requirement 4: Scraper Status API

**User Story:** As a developer, I want an API endpoint that returns the latest scraping job status, so that the dashboard can display current scraper state.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/scraper/status endpoint
2. WHEN the endpoint receives a request, THE System SHALL query the most recent scraping_job record
3. THE System SHALL return the job's status, started_at, completed_at, and leads_found
4. THE System SHALL calculate and return the job duration in seconds
5. WHEN no scraping jobs exist, THE System SHALL return a null status with appropriate message
6. THE System SHALL return data in JSON format with success flag
7. IF the database query fails, THEN THE System SHALL return an error response with 500 status code
8. THE System SHALL require authentication to access the endpoint

### Requirement 5: Job History Display

**User Story:** As a real estate specialist, I want to see a history of recent scraping jobs with their results, so that I can track scraper performance over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Scraping History" section below the lead feed
2. THE Job_History SHALL display the 10 most recent scraping jobs in a table format
3. FOR ALL jobs in the table, THE Job_History SHALL display the started timestamp
4. FOR ALL jobs in the table, THE Job_History SHALL display the job status with color-coded badge
5. FOR ALL jobs in the table, THE Job_History SHALL display the number of leads found
6. FOR ALL completed jobs, THE Job_History SHALL display the job duration in minutes and seconds
7. FOR ALL jobs in the table, THE Job_History SHALL display the Apify run ID as a truncated identifier
8. WHEN a job is RUNNING, THE Job_History SHALL display an animated spinner icon
9. WHEN the table is loading, THE Job_History SHALL display a skeleton loading state
10. WHEN no jobs exist, THE Job_History SHALL display an empty state message with illustration

### Requirement 6: Job Statistics Display

**User Story:** As a real estate specialist, I want to see detailed statistics for each scraping job, so that I can understand what types of leads were found.

#### Acceptance Criteria

1. FOR ALL completed jobs in Job_History, THE System SHALL display the total leads found
2. WHERE lead type breakdown is available, THE Job_History SHALL display owner leads count
3. WHERE lead type breakdown is available, THE Job_History SHALL display client leads count
4. WHERE agent detection data is available, THE Job_History SHALL display agents filtered count
5. THE Job_Statistics SHALL be displayed in a compact format within the table row
6. WHEN hovering over statistics, THE Job_History SHALL display a tooltip with detailed breakdown
7. THE Job_Statistics SHALL use icon indicators for owner leads (Building icon) and client leads (User icon)

### Requirement 7: Real-Time Dashboard Refresh

**User Story:** As a real estate specialist, I want the dashboard to automatically refresh after a successful scrape, so that I see new leads immediately without manual refresh.

#### Acceptance Criteria

1. WHEN a scraping job completes successfully, THE Dashboard SHALL automatically refresh the lead feed
2. WHEN a scraping job completes successfully, THE Dashboard SHALL automatically refresh the statistics cards
3. THE Dashboard SHALL poll the scraper status every 30 seconds to detect job completion
4. WHEN the status changes from RUNNING to COMPLETED, THE Dashboard SHALL trigger the data refresh
5. THE Dashboard SHALL display a toast notification when new leads are loaded
6. THE Dashboard SHALL maintain the user's current lead type filter (OWNER/CLIENT) during refresh
7. THE Dashboard SHALL maintain the user's current search query during refresh

### Requirement 8: Loading States and User Feedback

**User Story:** As a real estate specialist, I want clear visual feedback during scraper operations, so that I understand what the system is doing.

#### Acceptance Criteria

1. WHEN the Trigger_Button is clicked, THE System SHALL immediately show a loading spinner
2. WHEN the scraper is starting, THE Toast_Notification SHALL display "Starting scraper..." message
3. WHEN the scraper starts successfully, THE Toast_Notification SHALL display "Scraper started! Run ID: {runId}"
4. WHEN the scraper fails to start, THE Toast_Notification SHALL display "Failed to start scraper: {error}"
5. WHEN the job history is loading, THE Job_History SHALL display skeleton rows
6. WHEN the status display is loading, THE Status_Display SHALL display a loading spinner
7. THE Toast_Notification SHALL auto-dismiss after 5 seconds for success messages
8. THE Toast_Notification SHALL require manual dismissal for error messages
9. THE Toast_Notification SHALL include an icon indicator (checkmark for success, X for error)

### Requirement 9: Error Handling and Edge Cases

**User Story:** As a real estate specialist, I want the system to handle errors gracefully, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN the scraper trigger API returns an error, THE System SHALL display the error message in a toast
2. WHEN the job history API fails, THE Job_History SHALL display an error state with retry button
3. WHEN the status API fails, THE Status_Display SHALL display "Unable to load status" message
4. WHEN a scraping job is already running, THE System SHALL prevent triggering a duplicate job
5. IF the user clicks "Trigger Scrape" while a job is running, THEN THE Toast_Notification SHALL display "A scrape is already in progress"
6. WHEN network connectivity is lost, THE System SHALL display appropriate offline messages
7. THE System SHALL log all API errors to the browser console for debugging
8. WHEN the retry button is clicked, THE System SHALL re-attempt the failed API request

### Requirement 10: Responsive Design and Mobile Support

**User Story:** As a real estate specialist using a mobile device, I want the scraper controls to work well on small screens, so that I can trigger scrapes from anywhere.

#### Acceptance Criteria

1. THE Trigger_Button SHALL be fully functional on mobile devices (touch-friendly)
2. THE Status_Display SHALL adapt to narrow screens without horizontal scrolling
3. THE Job_History table SHALL be horizontally scrollable on mobile devices
4. THE Job_History table SHALL prioritize essential columns (status, leads, time) on mobile
5. THE Toast_Notification SHALL be positioned appropriately for mobile viewports
6. THE Trigger_Button SHALL maintain minimum touch target size of 44x44 pixels
7. THE Job_History SHALL use responsive typography that scales appropriately
8. WHEN on mobile, THE Job_History SHALL hide less critical columns (run ID, detailed stats)
