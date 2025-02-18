# Ethora Chat Protocol Documentation

## Overview

The Ethora Chat Protocol is built on XMPP (Extensible Messaging and Presence Protocol) using WebSocket transport. It provides real-time messaging capabilities with support for group chats (Multi-User Chat or MUC), presence information, and custom data extensions.

## Connection Details

### WebSocket Endpoint
- Default URL: `wss://xmpp.ethoradev.com:5443/ws`
- Protocol: `xmpp-framing`
- Secure WebSocket (WSS) with TLS/SSL

### Authentication
- Method: SASL PLAIN
- Format: Base64-encoded string of `\x00username\x00password`
- JID (Jabber ID) format: `user_id@xmpp.ethoradev.com`
- Room JID format: `room_id@conference.xmpp.ethoradev.com`

## Connection Flow

1. **Initial Connection**
   ```xml
   <open xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="xmpp.ethoradev.com" version="1.0"/>
   ```

2. **Authentication**
   ```xml
   <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
     [base64-encoded-credentials]
   </auth>
   ```

3. **New Stream After Auth**
   ```xml
   <open xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="xmpp.ethoradev.com" version="1.0"/>
   ```

4. **Resource Binding**
   ```xml
   <iq type="set" id="bind">
     <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
       <resource>bot</resource>
     </bind>
   </iq>
   ```

5. **Session Establishment**
   ```xml
   <iq type="set" id="session">
     <session xmlns="urn:ietf:params:xml:ns:xmpp-session"/>
   </iq>
   ```

## Room Operations

### Joining a Room
```xml
<presence to="room_id@conference.xmpp.ethoradev.com/user_id">
  <x xmlns="http://jabber.org/protocol/muc"/>
  <data xmlns="jabber:client" 
        fullName="Bot Name" 
        senderFirstName="Bot Name" 
        senderLastName="AI" 
        showInChannel="true"/>
</presence>
```

### Sending Messages
```xml
<message to="room_id@conference.xmpp.ethoradev.com" type="groupchat">
  <body>Message text</body>
  <data xmlns="jabber:client" 
        fullName="Bot Name" 
        senderFirstName="Bot Name" 
        senderLastName="AI" 
        showInChannel="true"/>
</message>
```

## Custom Extensions

### User Data Extension
The `<data>` element with `xmlns="jabber:client"` provides additional user information:
- `fullName`: Complete display name
- `senderFirstName`: User's first name
- `senderLastName`: User's last name
- `showInChannel`: Visibility flag ("true"/"false")

## Message Types

1. **Group Chat Messages**
   - Type: `groupchat`
   - Contains: message body and user data
   - Used in: room communications

2. **Presence Updates**
   - Type: presence stanza
   - Contains: MUC information and user data
   - Used in: room joins, status updates

## Error Handling

### Common Error Responses
1. Authentication Failures
   ```xml
   <failure xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>
     <not-authorized/>
   </failure>
   ```

2. Connection Errors
   ```xml
   <stream:error>
     <connection-timeout xmlns='urn:ietf:params:xml:ns:xmpp-streams'/>
   </stream:error>
   ```

### Best Practices
1. Implement reconnection logic with exponential backoff
2. Handle WebSocket disconnections gracefully
3. Maintain presence by responding to server pings
4. Log all stanzas for debugging purposes

## Security Considerations

1. **TLS/SSL**
   - Always use secure WebSocket connections (WSS)
   - Verify server certificates in production

2. **Authentication**
   - Never send plain-text credentials
   - Use SASL PLAIN with base64 encoding
   - Store credentials securely

3. **Rate Limiting**
   - Implement message rate limiting
   - Handle server throttling responses

## Implementation Examples

### Python Example (Using websockets)
```python
import websockets
import base64

# Authentication token generation
auth_str = f"\x00{username}\x00{password}"
token = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

# Connection establishment
websocket = await websockets.connect(
    'wss://xmpp.ethoradev.com:5443/ws',
    subprotocols=['xmpp-framing']
)

# Send initial stream header
await websocket.send(
    '<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" '
    'to="xmpp.ethoradev.com" version="1.0"/>'
)
```

### TypeScript Example (Using @xmpp/client)
```typescript
import { client, xml } from '@xmpp/client'

const xmpp = client({
  service: 'wss://xmpp.ethoradev.com:5443/ws',
  username: jid.split('@')[0],
  password: password,
})

xmpp.on('online', async () => {
  // Join room
  await xmpp.send(
    xml('presence', { to: `${roomJid}/${username}` },
      xml('x', { xmlns: 'http://jabber.org/protocol/muc' }),
      xml('data', { 
        xmlns: 'jabber:client',
        fullName: botName,
        senderFirstName: botName,
        senderLastName: 'AI',
        showInChannel: 'true'
      })
    )
  )
})
```

## References

1. XMPP Core: [RFC 6120](https://datatracker.ietf.org/doc/html/rfc6120)
2. XMPP WebSocket Binding: [RFC 7395](https://datatracker.ietf.org/doc/html/rfc7395)
3. XMPP MUC: [XEP-0045](https://xmpp.org/extensions/xep-0045.html) 