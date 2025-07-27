import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { userTrackingService } from '../services/UserTrackingService';

const AnalyticsDisplay = ({ userId }) => {
    const [analytics, setAnalytics] = useState({
        pageEnterTime: '',
        pageExitTime: '',
        totalTimeSpent: ''
    });

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const sessionData = await userTrackingService.getSessionAnalytics(userId);
                if (sessionData) {
                    setAnalytics({
                        pageEnterTime: sessionData.pageEnterTime || '',
                        pageExitTime: sessionData.pageExitTime || '',
                        totalTimeSpent: sessionData.totalTimeSpent || ''
                    });
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
            }
        };

        loadAnalytics();
        const interval = setInterval(loadAnalytics, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [userId]);

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Session Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Session Start Time:</Text>
                    <Text style={styles.value}>{analytics.pageEnterTime}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Session End Time:</Text>
                    <Text style={styles.value}>{analytics.pageExitTime}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Total Session Duration:</Text>
                    <Text style={styles.value}>{analytics.totalTimeSpent}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        margin: 10,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        color: '#aaa',
        fontSize: 14,
    },
    value: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    }
});

export default AnalyticsDisplay; 