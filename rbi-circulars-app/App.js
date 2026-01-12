import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text, StyleSheet } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SearchScreen from './src/screens/SearchScreen';
import SectionDetailScreen from './src/screens/SectionDetailScreen';
import CircularsScreen from './src/screens/CircularsScreen';

// Theme
import { COLORS, SIZES } from './src/constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ icon, label, focused }) => (
    <View style={styles.tabIconContainer}>
        <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
);

// Bottom Tab Navigator
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🏠" label="Home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📚" label="Library" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🔍" label="Search" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Circulars"
                component={CircularsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📄" label="PDFs" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// Main App with Stack Navigator
export default function App() {
    return (
        <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="SectionDetail" component={SectionDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 70,
        paddingTop: SIZES.spacing.sm,
        paddingBottom: SIZES.spacing.sm,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    tabIconFocused: {
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    tabLabelFocused: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
