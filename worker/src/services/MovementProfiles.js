class MovementProfiles {
  constructor() {
    this.profiles = {
      relaxed: {
        clickDelay: { min: 200, max: 500 },
        mouseDelay: { min: 100, max: 300 },
        mouseSteps: 10,
        interval: 5000, // 5 seconds between actions
        description: 'Human-like, relaxed timing'
      },
      normal: {
        clickDelay: { min: 100, max: 300 },
        mouseDelay: { min: 50, max: 200 },
        mouseSteps: 8,
        interval: 3000, // 3 seconds between actions
        description: 'Balanced, normal timing'
      },
      fast: {
        clickDelay: { min: 50, max: 150 },
        mouseDelay: { min: 20, max: 100 },
        mouseSteps: 5,
        interval: 2000, // 2 seconds between actions
        description: 'Quick, efficient timing'
      },
      aggressive: {
        clickDelay: { min: 20, max: 80 },
        mouseDelay: { min: 10, max: 50 },
        mouseSteps: 3,
        interval: 1000, // 1 second between actions
        description: 'Rapid, aggressive timing'
      }
    }
  }

  getProfile(profileName) {
    return this.profiles[profileName] || this.profiles.normal
  }

  getInterval(profileName) {
    return this.getProfile(profileName).interval
  }

  getAllProfiles() {
    return Object.keys(this.profiles).map(name => ({
      name,
      ...this.profiles[name]
    }))
  }

  isValidProfile(profileName) {
    return profileName in this.profiles
  }
}

module.exports = MovementProfiles
