'use strict'

const models = require('../../models')
const logger = require('../../logger')

exports.passportGeneralCallback = function callback (accessToken, refreshToken, profile, done) {
  var stringifiedProfile = JSON.stringify(profile)
  let model = models.User.findOrCreate({
    where: {
      profileid: profile.id.toString()
    },
    defaults: {
      profile: stringifiedProfile,
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  })
  if (process.env.BETA_EMAIL_TESTS.split(',').includes(profile.email)) {
    model = models.User.findOrCreate({
      where: {
        email: profile.email
      },
      defaults: {
        profileid: profile.id.toString(),
        profile: stringifiedProfile,
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    })
  }
  model.spread(function (user, created) {
    if (user) {
      var needSave = false
      if (user.profile !== stringifiedProfile) {
        user.profile = stringifiedProfile
        needSave = true
      }
      if (user.accessToken !== accessToken) {
        user.accessToken = accessToken
        needSave = true
      }
      if (user.refreshToken !== refreshToken) {
        user.refreshToken = refreshToken
        needSave = true
      }
      if (needSave) {
        user.save().then(function () {
          logger.debug(`user login: ${user.id}`)
          return done(null, user)
        })
      } else {
        logger.debug(`user login: ${user.id}`)
        return done(null, user)
      }
    }
  }).catch(function (err) {
    logger.error('auth callback failed: ' + err)
    return done(err, null)
  })
}
