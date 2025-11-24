const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const prisma = require('./database');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isActive: true,
            },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Local Strategy - Email/Password
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                });

                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                // Check if user has a password (not Google OAuth user)
                if (!user.password) {
                    return done(null, false, {
                        message: 'Please sign in with Google',
                    });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                // Check if account is active
                if (!user.isActive) {
                    return done(null, false, { message: 'Account is deactivated' });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await prisma.user.findUnique({
                    where: { googleId: profile.id },
                });

                if (user) {
                    return done(null, user);
                }

                // Check if email already exists (user might have signed up with email)
                const emailExists = await prisma.user.findUnique({
                    where: { email: profile.emails[0].value },
                });

                if (emailExists) {
                    // Link Google account to existing user
                    user = await prisma.user.update({
                        where: { email: profile.emails[0].value },
                        data: {
                            googleId: profile.id,
                            avatar: profile.photos[0]?.value,
                            isVerified: true,
                        },
                    });
                    return done(null, user);
                }

                // Create new user
                user = await prisma.user.create({
                    data: {
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        avatar: profile.photos[0]?.value,
                        isVerified: true,
                        username: profile.emails[0].value.split('@')[0], // Generate username from email
                    },
                });

                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

module.exports = passport;
