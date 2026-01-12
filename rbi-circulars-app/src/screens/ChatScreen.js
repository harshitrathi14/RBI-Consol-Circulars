import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { queryCirculars, getCategories } from '../services/api';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const flatListRef = useRef();

    useEffect(() => {
        // Initial greeting
        setMessages([
            {
                id: 'init',
                text: 'Hello! I am your RBI Master Circulars assistant. Ask me anything about NBFC regulations.',
                sender: 'bot'
            }
        ]);
        // Fetch categories
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now().toString(),
            text: input,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await queryCirculars(userMsg.text);

            const botMsg = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                sender: 'bot',
                sources: response.sources
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                text: "An error occurred while searching.",
                sender: 'bot',
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderSource = (source) => (
        <View key={source.filename} style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>{source.circular_title || source.filename}</Text>
            <Text style={styles.sourceText} numberOfLines={2}>{source.chunk_preview}</Text>
        </View>
    );

    const renderItem = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.botMessageContainer
            ]}>
                <View style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    item.isError && styles.errorBubble
                ]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                        {item.text}
                    </Text>

                    {item.sources && item.sources.length > 0 && (
                        <View style={styles.sourcesContainer}>
                            <Text style={styles.sourcesHeader}>Sources:</Text>
                            {item.sources.map(renderSource)}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>RBI Circulars Chat</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask a question..."
                    placeholderTextColor="#666"
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#1E3A8A', // Dark Blue
        padding: 16,
        alignItems: 'center',
        elevation: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 16,
        flexDirection: 'row',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 16,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: '#2563EB', // Blue
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    errorBubble: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    botText: {
        color: '#1F2937',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000',
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sourcesContainer: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    sourcesHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 4,
    },
    sourceCard: {
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sourceTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
    },
    sourceText: {
        fontSize: 11,
        color: '#4B5563',
        marginTop: 2,
    },
});

export default ChatScreen;
