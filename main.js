const { REST } = require('@discordjs/rest');
const { API } = require('@discordjs/core');

const rest = new REST().setToken(process.env.TOKEN);
const api = new API(rest);

exports.handler = async () => {
    const todayEvents = await getTodaysEvents(api);
    if (todayEvents.length === 0) return 200;

    const eventMessage = generateMessageOfEvents(todayEvents);
    await api.channels.createMessage(process.env.REMIND_CHANNEL_ID, { content: `本日の予定\n${eventMessage}`});
    return 200;
}

const getTodaysEvents = async () => {
    const events = await api.guilds.getScheduledEvents(process.env.GUILD_ID);

    const todayStartTimestamp = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const todayEndTimestamp = new Date(new Date().setHours(23, 59, 59, 999)).getTime();
    return events.filter(
        ({ scheduled_start_time: scheduledStartTimestamp }) => todayStartTimestamp <= dateToJst(new Date(scheduledStartTimestamp)).getTime()
            && todayEndTimestamp >= dateToJst(new Date(scheduledStartTimestamp)).getTime()
    );
}

const generateMessageOfEvents = (todayEvents) => {
    const eventMessages = [];
    for (todayEvent of todayEvents) {
        const eventStartDateTime = dateToJst(new Date(todayEvent.scheduled_start_time));
        const hours = String(eventStartDateTime.getHours()).padStart(2, '0');
        const minutes = String(eventStartDateTime.getMinutes()).padStart(2, '0');

        const formattedEventStartTime = `${hours}:${minutes}`;
        eventMessages.push(`- ${formattedEventStartTime}~ [${todayEvent.name}](https://discord.com/events/${process.env.GUILD_ID}/${todayEvent.id})`);
    }
    return eventMessages.join('\n');
}

const dateToJst = (date) => {
    return new Date(date.getTime() + ((date.getTimezoneOffset() + (9 * 60)) * 60 * 1000));
}
