# Achievement System Design

## 1. Data Structure

### Achievement Model
```json
{
  "id": "unique_identifier",
  "name": "Achievement Name",
  "description": "Description of what the user did to earn this achievement",
  "icon": "icon_identifier",
  "category": "trading|portfolio|social|account",
  "difficulty": "bronze|silver|gold|platinum",
  "points": 100,
  "hidden": false
}
```

### User Achievement Model
```json
{
  "user_id": "user_identifier",
  "achievement_id": "achievement_identifier",
  "earned_at": "2025-05-14T12:00:00Z",
  "progress": 100,
  "completed": true
}
```

## 2. Database Schema

### Achievements Table
```sql
CREATE TABLE achievements (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category ENUM('trading', 'portfolio', 'social', 'account') NOT NULL,
  difficulty ENUM('bronze', 'silver', 'gold', 'platinum') NOT NULL,
  points INT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Achievements Table
```sql
CREATE TABLE user_achievements (
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
```

## 3. Achievement Types and Triggers

### Trading Achievements
- First Trade: Complete your first stock trade
- Trading Novice: Complete 5 trades
- Trading Adept: Complete 25 trades
- Trading Master: Complete 100 trades
- Diverse Trader: Trade stocks from 5 different sectors
- Day Trader: Make 10 trades in a single day
- Profit Hunter: Make a profit of $1,000 in a single trade

### Portfolio Achievements
- Portfolio Builder: Own stocks worth $10,000
- Portfolio Master: Own stocks worth $100,000
- Millionaire: Reach a total portfolio value of $1,000,000
- Sector Specialist: Own 5 stocks from the same sector
- Diversification Expert: Own stocks from all available sectors

### Social Achievements
- Chatterbox: Send 10 chat messages
- Social Butterfly: Send 100 chat messages
- Leaderboard Rookie: Appear on the leaderboard
- Top 10: Reach the top 10 on the leaderboard
- Champion: Reach #1 on the leaderboard

### Account Achievements
- Welcome: Create an account
- Regular: Log in for 7 consecutive days
- Dedicated: Log in for 30 consecutive days
- Profile Customizer: Upload a profile picture

## 4. API Endpoints

### Backend Endpoints
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/{id}` - Get a specific achievement
- `GET /api/users/me/achievements` - Get current user's achievements
- `POST /api/users/me/achievements/{id}/progress` - Update progress for an achievement
- `GET /api/users/{id}/achievements` - Get another user's achievements (for leaderboard)

### Frontend Service Functions
- `getAllAchievements()` - Get all possible achievements
- `getUserAchievements()` - Get achievements for current user
- `getAchievementProgress(achievementId)` - Get progress for a specific achievement
- `updateAchievementProgress(achievementId, progress)` - Update progress for an achievement

## 5. Achievement Triggers

Achievements can be triggered by:
1. **Direct Actions**: User performs specific actions (making a trade, sending a chat message)
2. **Cumulative Progress**: User reaches thresholds (portfolio value, number of trades)
3. **Timed Events**: User performs actions within time constraints (login streaks)
4. **Special Conditions**: Unique situations (reaching #1 on leaderboard)

## 6. UI Components

### Achievement Card Component
Displays a single achievement with:
- Icon
- Name
- Description
- Progress indicator
- Earned status and date

### Achievements Page
- Grid/List of all achievements
- Filter by category and completion status
- Sort by difficulty, points, or completion date

### Achievement Notification
- Toast notification when achievement is earned
- Animation and sound effect
- Link to view the achievement details

### Dashboard Integration
- Achievement summary in Dashboard
- Recent achievements widget
- Total points display

## 7. Implementation Strategy

1. **Backend First**: Implement database schema and API endpoints
2. **Frontend Services**: Create achievement service for data fetching
3. **Core UI Components**: Build achievement card and list components
4. **Dashboard Integration**: Add achievements widget to Dashboard
5. **Notifications**: Implement toast notifications for new achievements
6. **Triggers**: Implement achievement trigger logic in relevant services

## 8. Achievement Storage and Performance

To ensure good performance:
- Cache achievement definitions on frontend
- Batch update achievement progress
- Use WebSocket events for real-time achievement notifications
- Implement progressive loading for achievement lists