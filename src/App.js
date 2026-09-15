import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'daily-tracker-v1';
const API_BASE = process.env.REACT_APP_API_BASE || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'
    : '/api'
);

const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_EVENTS = [
  { id: 'shuttle', label: 'Shuttle', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'sleep', label: 'Sleep (hrs)', type: 'number', recurrenceType: 'daily', selectedDays: [] },
  { id: 'office', label: 'Office', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'badam', label: 'Badam & dry fruits', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'tablet1', label: 'Tablet 1', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'tablet2', label: 'Tablet 2', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'tablet3', label: 'Tablet 3', type: 'checkbox', recurrenceType: 'daily', selectedDays: [] },
  { id: 'capsule1', label: 'Capsule 1', type: 'checkbox', recurrenceType: 'weekly', selectedDays: ['Mon', 'Wed', 'Fri'] },
  { id: 'capsule2', label: 'Capsule 2', type: 'checkbox', recurrenceType: 'weekly', selectedDays: ['Mon', 'Wed', 'Fri'] },
  { id: 'tan', label: 'Tan removal', type: 'checkbox', recurrenceType: 'weekly', selectedDays: ['Tue', 'Thu'] },
  { id: 'oil', label: 'Oil', type: 'checkbox', recurrenceType: 'weekly', selectedDays: ['Tue', 'Thu'] },
  { id: 'meal1', label: 'Meal 1', type: 'text', recurrenceType: 'daily', selectedDays: [] },
  { id: 'meal2', label: 'Meal 2', type: 'text', recurrenceType: 'daily', selectedDays: [] },
  { id: 'meal3', label: 'Meal 3', type: 'text', recurrenceType: 'daily', selectedDays: [] },
  { id: 'meal4', label: 'Meal 4', type: 'text', recurrenceType: 'daily', selectedDays: [] },
  { id: 'water', label: 'Water (glasses)', type: 'number', recurrenceType: 'daily', selectedDays: [] },
  { id: 'steps', label: 'Steps', type: 'number', recurrenceType: 'daily', selectedDays: [] },
  { id: 'dsa', label: 'DSA problems solved', type: 'number', recurrenceType: 'daily', selectedDays: [] },
  { id: 'weight', label: 'Weight (kg)', type: 'number', recurrenceType: 'daily', selectedDays: [] },
];

const DEFAULT_EXPENSE_TAGS = [
  'PG rent',
  'Bike',
  'Petrol',
  'Movies',
  'OTTs',
  'Outside Food',
  'Spent on Parents',
  'Others',
];

const DEFAULT_EVENT_IDS = new Set(DEFAULT_EVENTS.map((event) => event.id));

const getWeekdayForDate = (dateStr) => {
  const safeDate = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const date = new Date(safeDate);
  return WEEK_DAYS[date.getDay()];
};

const eventMatchesRecurrence = (event, dateStr) => {
  if (!event || !dateStr) return true;
  if (event.recurrenceType === 'daily') return true;
  if (event.recurrenceType === 'weekly' && Array.isArray(event.selectedDays)) {
    return event.selectedDays.includes(getWeekdayForDate(dateStr));
  }
  return true;
};

function App() {
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [expenseDate, setExpenseDate] = useState(toDateInputValue());
  const [selectedPage, setSelectedPage] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(toDateInputValue().slice(0, 7));
  const [customEvents, setCustomEvents] = useState([]);
  const [expenseTags, setExpenseTags] = useState(DEFAULT_EXPENSE_TAGS);
  const [records, setRecords] = useState([]);
  const [draftEntries, setDraftEntries] = useState({});

  const syncLocalRecords = (nextRecords) => {
    setRecords(nextRecords);
  };

  const loadRecordsFromApi = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/records`);
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      if (Array.isArray(data)) {
        syncLocalRecords(data);
      }
    } catch (error) {
      console.warn('Falling back to browser storage for records:', error.message);
    }
  }, []);

  const loadCustomEventsFromApi = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/custom-events`);
      if (!response.ok) throw new Error('Failed to fetch custom events');
      const data = await response.json();
      setCustomEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Falling back to browser storage for custom events:', error.message);
      setCustomEvents([]);
    }
  }, []);

  useEffect(() => {
    loadRecordsFromApi();
    loadCustomEventsFromApi();
  }, [loadRecordsFromApi, loadCustomEventsFromApi]);

  useEffect(() => {
    setRecords([]);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('custom-events-v1');
      localStorage.removeItem('expense-tags-v1');
    }
  }, []);

  const safeCustomEvents = useMemo(() => (Array.isArray(customEvents) ? customEvents : []), [customEvents]);
  const safeRecords = useMemo(() => (Array.isArray(records) ? records : []), [records]);

  const allEvents = useMemo(
    () => [...DEFAULT_EVENTS, ...safeCustomEvents].filter((event) => eventMatchesRecurrence(event, selectedDate)),
    [safeCustomEvents, selectedDate]
  );

  const visibleEventIds = useMemo(
    () => new Set(allEvents.map((event) => event.id)),
    [allEvents]
  );

  const currentRecord = useMemo(() => {
    return safeRecords.find((item) => item.date === selectedDate) || { date: selectedDate, entries: {} };
  }, [safeRecords, selectedDate]);

  useEffect(() => {
    setDraftEntries(currentRecord.entries || {});
  }, [selectedDate, currentRecord.entries]);

  const getDefaultEntryFallbacks = (date) => {
    const monthPrefix = date.slice(0, 7);
    const sameMonthRecords = safeRecords.filter((item) => item.date.startsWith(monthPrefix));
    const monthDefaults = sameMonthRecords.reduce((acc, record) => {
      Object.entries(record.entries).forEach(([key, entry]) => {
        if (DEFAULT_EVENT_IDS.has(key)) {
          acc[key] = entry;
        }
      });
      return acc;
    }, {});

    return monthDefaults;
  };

  const saveRecordToMongo = async (recordPayload) => {
    try {
      const response = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to save record');
      }

      return await response.json();
    } catch (error) {
      console.warn('Mongo save failed for records, using local storage fallback:', error.message);
      return null;
    }
  };

  const updateEntry = (eventId, eventLabel, eventType, value) => {
    const formattedValue =
      eventType === 'checkbox'
        ? Boolean(value)
        : eventType === 'number' || eventType === 'amount'
          ? value === '' ? 0 : Number(value)
          : value;

    setDraftEntries((previous) => ({
      ...previous,
      [eventId]: {
        label: eventLabel,
        type: eventType,
        value: formattedValue,
      },
    }));
  };

  const submitDailyRecord = async () => {
    const payload = {
      date: selectedDate,
      entries: {
        ...getDefaultEntryFallbacks(selectedDate),
        ...draftEntries,
      },
    };

    const filtered = safeRecords.filter((item) => item.date !== selectedDate);
    const updatedRecords = [...filtered, payload].sort((a, b) => a.date.localeCompare(b.date));
    syncLocalRecords(updatedRecords);
    await saveRecordToMongo(payload);
    alert(`Saved successfully for ${selectedDate}`);
  };

  const getEntryValue = (eventId) => draftEntries[eventId]?.value ?? '';

  const addCustomEvent = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const eventName = String(formData.get('eventName') || '').trim();
    const eventType = String(formData.get('eventType') || 'text');
    const recurrenceType = String(formData.get('recurrenceType') || 'daily');
    const selectedDays = Array.from(formData.getAll('selectedDays')).map(String);

    if (!eventName) {
      return;
    }

    const normalizedName = eventName.toLowerCase();
    const exists = safeCustomEvents.some(
      (item) => item && item.label && String(item.label).toLowerCase() === normalizedName
    );

    if (exists) {
      alert('No same event can be added');
      if (event?.currentTarget?.reset) {
        event.currentTarget.reset();
      }
      return;
    }

    const newCustomEvent = {
      id: normalizedName.replace(/\s+/g, '-'),
      label: eventName,
      type: eventType,
      recurrenceType,
      selectedDays: recurrenceType === 'weekly' ? selectedDays : [],
    };

    setCustomEvents((previous) => {
      const base = Array.isArray(previous) ? previous : [];
      return [...base, newCustomEvent];
    });

    try {
      const response = await fetch(`${API_BASE}/custom-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to save custom event');
      }

      alert(`Custom event "${eventName}" added successfully`);
    } catch (error) {
      console.warn('Mongo save failed for custom event, fallback stored locally:', error.message);
      alert(`Custom event "${eventName}" added locally`);
    }

    if (event?.currentTarget?.reset) {
      event.currentTarget.reset();
    }
  };

  const addExpenseForDate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const inputExpenseDate = String(formData.get('expenseDate') || expenseDate || toDateInputValue()).trim();
    const expenseLabel = String(formData.get('expenseLabel') || '').trim();
    const expenseValue = Number(formData.get('expenseValue') || 0);
    const selectedTag = String(formData.get('expenseTag') || '').trim();
    const customTagValue = String(formData.get('customExpenseTag') || '').trim();
    const finalTag = customTagValue || selectedTag || 'Others';

    if (!inputExpenseDate || !expenseLabel || !Number.isFinite(expenseValue) || expenseValue <= 0) {
      return;
    }

    setExpenseDate(inputExpenseDate);

    if (customTagValue) {
      setExpenseTags((previous) => {
        const trimmed = customTagValue.trim();
        if (!trimmed || previous.includes(trimmed)) return previous;
        return [...previous, trimmed];
      });
    }

    const previousRecord = safeRecords.find((item) => item.date === inputExpenseDate) || { date: inputExpenseDate, entries: {} };
    const nextEntries = { ...previousRecord.entries };
    const expenseId = `expense-${Date.now()}`;

    nextEntries[expenseId] = {
      label: expenseLabel,
      type: 'amount',
      value: expenseValue,
      tag: finalTag,
    };

    const updated = [...safeRecords.filter((item) => item.date !== inputExpenseDate), { date: inputExpenseDate, entries: nextEntries }].sort((a, b) => a.date.localeCompare(b.date));
    syncLocalRecords(updated);
    await saveRecordToMongo({ date: inputExpenseDate, entries: nextEntries });

    try {
      const expenseResponse = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: inputExpenseDate,
          label: expenseLabel,
          amount: expenseValue,
          tag: finalTag,
        }),
      });

      if (!expenseResponse.ok) {
        throw new Error('Failed to save expense');
      }

      alert(`Expense "${expenseLabel}" added successfully for ${inputExpenseDate}`);
    } catch (error) {
      console.warn('Mongo save failed for expense document:', error.message);
      alert(`Expense "${expenseLabel}" added locally for ${inputExpenseDate}`);
    }

    if (event?.currentTarget?.reset) {
      event.currentTarget.reset();
    }
  };

const monthRecords = safeRecords.filter((item) => item.date.startsWith(selectedMonth));

  const isExpenseEntry = (entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const label = String(entry.label || '').toLowerCase();
    return (
      entry.type === 'amount' && !/water/i.test(label) && !/glasses/i.test(label)
    );
  };

  const totalExpense = monthRecords.reduce((sum, record) => {
    const expenseValues = Object.values(record.entries).filter(isExpenseEntry);
    return (
      sum +
      expenseValues.reduce((innerSum, entry) => innerSum + (Number(entry.value) || 0), 0)
    );
  }, 0);

  const expenseByTag = useMemo(() => {
    const map = new Map();

    monthRecords.forEach((record) => {
      Object.values(record.entries)
        .filter(isExpenseEntry)
        .forEach((entry) => {
          const tag = entry.tag || 'Others';
          map.set(tag, (map.get(tag) || 0) + Number(entry.value || 0));
        });
    });

    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthRecords]);

  const maxExpenseTagValue = expenseByTag.length ? Math.max(...expenseByTag.map(([, value]) => value)) : 0;

  const waterTotal = monthRecords.reduce((sum, record) => {
    const value = Number(record.entries.water?.value || 0);
    return sum + value;
  }, 0);

  const stepTotal = monthRecords.reduce((sum, record) => {
    const value = Number(record.entries.steps?.value || 0);
    return sum + value;
  }, 0);

  const dsaTotal = monthRecords.reduce((sum, record) => {
    const value = Number(record.entries.dsa?.value || 0);
    return sum + value;
  }, 0);

  const weightValues = monthRecords
    .map((record) => ({
      date: record.date,
      value: Number(record.entries.weight?.value || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const avgWeight = weightValues.length
    ? weightValues.reduce((sum, item) => sum + item.value, 0) / weightValues.length
    : 0;

  const monthStartWeight = (() => {
    const startOfMonthEntries = weightValues.filter((item) => item.date.startsWith(selectedMonth));
    return startOfMonthEntries.length ? startOfMonthEntries[0].value : null;
  })();

  const latestWeight = weightValues.length ? weightValues[weightValues.length - 1].value : null;
  const monthWeightDelta = latestWeight !== null && monthStartWeight !== null ? latestWeight - monthStartWeight : null;
  const monthWeightDeltaText = monthWeightDelta === null ? 'No data' : `${monthWeightDelta >= 0 ? '+' : ''}${monthWeightDelta.toFixed(1)} kg`;
  const monthWeightDeltaClass = monthWeightDelta === null ? 'neutral' : monthWeightDelta >= 0 ? 'gain' : 'loss';

  const maxWeight = weightValues.length ? Math.max(...weightValues.map((item) => item.value)) : 0;
  const minWeight = weightValues.length ? Math.min(...weightValues.map((item) => item.value)) : 0;

  const longestDSAStreak = (() => {
    const sortedDates = [...safeRecords]
      .map((record) => record.date)
      .sort((a, b) => a.localeCompare(b))
      .filter((date) => date.startsWith(selectedMonth));

    let longest = 0;
    let current = 0;

    sortedDates.forEach((date) => {
      const value = Number((safeRecords.find((record) => record.date === date)?.entries?.dsa?.value) || 0);
      if (value > 0) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });

    return longest;
  })();

  const sleepBucketSummary = (() => {
    const buckets = { '4-6': 0, '6-8': 0, '8+': 0 };

    monthRecords.forEach((record) => {
      const sleepValue = Number(record.entries.sleep?.value || 0);

      if (sleepValue > 0 && sleepValue < 4) {
        buckets['4-6'] += 1;
      } else if (sleepValue >= 4 && sleepValue < 6) {
        buckets['4-6'] += 1;
      } else if (sleepValue >= 6 && sleepValue < 8) {
        buckets['6-8'] += 1;
      } else if (sleepValue >= 8) {
        buckets['8+'] += 1;
      }
    });

    return Object.fromEntries(
      Object.entries(buckets).filter(([, count]) => count > 0)
    );
  })();

  const summaryRows = DEFAULT_EVENTS.filter((event) => !['meal1', 'meal2', 'meal3', 'meal4', 'water'].includes(event.id)).map((event) => {
    const relevantRecords = monthRecords.filter((record) => eventMatchesRecurrence(event, record.date));
    const values = relevantRecords
      .map((record) => record.entries[event.id])
      .filter(Boolean)
      .map((entry) => entry.value);

    if (event.id === 'steps') {
      const totalSteps = values.reduce((sum, value) => sum + Number(value || 0), 0);
      return {
        label: event.label,
        count: `${totalSteps.toLocaleString()}`,
        meta: `${relevantRecords.length || 0} tracked days`,
      };
    }

    if (event.id === 'dsa') {
      return {
        label: event.label,
        count: `${dsaTotal}`,
        meta: `${longestDSAStreak} day streak`,
      };
    }

    if (event.id === 'weight') {
      return {
        label: event.label,
        count: avgWeight ? `${avgWeight.toFixed(1)} kg` : 'No data',
        meta: weightValues.length ? `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg` : 'No weight entries',
      };
    }

    if (event.id === 'sleep') {
      const totalSleep = values.reduce((sum, value) => sum + Number(value || 0), 0);
      const sleepText = Object.entries(sleepBucketSummary)
        .map(([bucket, count]) => `${bucket} hrs: ${count} days`)
        .join(' • ');

      return {
        label: event.label,
        count: `${totalSleep.toFixed(1)} hrs`,
        meta: sleepText || 'No sleep data',
      };
    }

    if (event.type === 'checkbox') {
      const activeDays = values.filter(Boolean).length;
      return {
        label: event.label,
        count: `${activeDays} days`,
        meta: `${activeDays}/${relevantRecords.length || 0} days`,
      };
    }

    const positiveDays = values.filter((value) => Number(value) > 0).length;
    const totalValue = values.reduce((sum, value) => sum + Number(value || 0), 0);

    return {
      label: event.label,
      count: `${positiveDays} days`,
      meta: `${totalValue} total`,
    };
  });

  const dayEntries = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const formatExportValue = (entry) => {
    if (entry.type === 'checkbox') {
      return entry.value ? 'Yes' : 'No';
    }

    if (entry.type === 'text') {
      return String(entry.value ?? '');
    }

    if (typeof entry.value === 'number') {
      return String(entry.value);
    }

    return String(entry.value ?? '');
  };

  const exportCsv = () => {
    const rows = [['Date', 'Event', 'Value']];

    [...safeRecords]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((record) => {
        Object.values(record.entries).forEach((entry) => {
          rows.push([record.date, entry.label, formatExportValue(entry)]);
        });
      });

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tracker-export-${selectedMonth || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderInputField = (event) => {
    const value = getEntryValue(event.id);

    if (event.type === 'checkbox') {
      return (
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateEntry(event.id, event.label, event.type, e.target.checked)}
          />
          <span>{value ? 'Done' : 'Not done yet'}</span>
        </label>
      );
    }

    if (event.type === 'text') {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateEntry(event.id, event.label, event.type, e.target.value)}
          placeholder="Enter details"
        />
      );
    }

    return (
      <input
        type="number"
        value={value === '' ? '' : value}
        min="0"
        step={event.type === 'amount' ? '0.01' : '1'}
        onChange={(e) => updateEntry(event.id, event.label, event.type, e.target.value)}
      />
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal dashboard</p>
          <h1>Daily tracker</h1>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          {['daily', 'expenses', 'expense-history', 'history', 'weight', 'monthly'].map((page) => (
            <button
              key={page}
              type="button"
              className={selectedPage === page ? 'nav-button active' : 'nav-button'}
              onClick={() => setSelectedPage(page)}
            >
              {page === 'daily'
                ? 'Checklist'
                : page === 'expenses'
                  ? 'Expense Date'
                  : page === 'expense-history'
                    ? 'Expense Month'
                    : page === 'history'
                      ? 'History'
                      : page === 'weight'
                        ? 'Weight Trend'
                        : 'Monthly Stats'}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {selectedPage === 'daily' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Daily planner</p>
                <h2>Track your routines</h2>
              </div>

              <label className="date-picker">
                <span>Select date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>
            </div>

            <div className="panel-header" style={{ marginBottom: '16px', alignItems: 'center' }}>
              <div>
                <p className="section-kicker">Daily entries</p>
                <h2>Checklist for {selectedDate}</h2>
              </div>
              <button type="button" className="export-button" onClick={submitDailyRecord}>
                Submit day
              </button>
            </div>

            <div className="event-grid">
              {DEFAULT_EVENTS.map((event) => {
                const isVisible = visibleEventIds.has(event.id);
                const isDisabled = !isVisible;

                return (
                  <div
                    key={event.id}
                    className={isDisabled ? 'event-card disabled-card' : 'event-card'}
                    title={isDisabled ? `This event is only for ${event.selectedDays?.join(', ') || 'selected days'}` : ''}
                  >
                    <div className="event-topline">
                      <strong>{event.label}</strong>
                      <span>{event.type}</span>
                    </div>
                    {isDisabled ? (
                      <div className="disabled-text">
                        {event.recurrenceType === 'weekly'
                          ? `Only on ${event.selectedDays?.join(', ')}`
                          : 'Not scheduled for this day'}
                      </div>
                    ) : event.id.startsWith('meal') ? (
                      <textarea
                        rows="2"
                        value={getEntryValue(event.id) || ''}
                        onChange={(e) => updateEntry(event.id, event.label, event.type, e.target.value)}
                        placeholder="What did you eat?"
                      />
                    ) : (
                      renderInputField(event)
                    )}
                  </div>
                );
              })}

              {safeCustomEvents
                .filter((event) => eventMatchesRecurrence(event, selectedDate))
                .map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-topline">
                      <strong>{event.label}</strong>
                      <span>{event.type}</span>
                    </div>
                    {event.id.startsWith('meal') ? (
                      <textarea
                        rows="2"
                        value={getEntryValue(event.id) || ''}
                        onChange={(e) => updateEntry(event.id, event.label, event.type, e.target.value)}
                        placeholder="What did you eat?"
                      />
                    ) : (
                      renderInputField(event)
                    )}
                  </div>
                ))}
            </div>

            <form className="custom-event-form" onSubmit={addCustomEvent}>
              <h3>Add custom event</h3>
              <div className="form-row">
                <input type="text" name="eventName" placeholder="Tan removal, oil, movie, gym, etc." />
                <select name="eventType" defaultValue="text">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="amount">Amount</option>
                  <option value="checkbox">Check</option>
                </select>
                <select name="recurrenceType" defaultValue="daily">
                  <option value="daily">Daily</option>
                  <option value="weekly">Selected days</option>
                </select>
                <button type="submit">Add</button>
              </div>

              <div className="weekday-picker">
                {WEEK_DAYS.map((day) => (
                  <label key={day} className="weekday-option">
                    <input type="checkbox" name="selectedDays" value={day} />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </form>
          </section>
        )}

        {selectedPage === 'expenses' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Expenses</p>
                <h2>Expense by date</h2>
              </div>

              <label className="date-picker">
                <span>Select date</span>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </label>
            </div>

            <div className="stat-cards">
              <div className="stat-card accent">
                <span>Spend on {expenseDate || 'selected date'}</span>
                <strong>₹{(
                  safeRecords
                    .find((record) => record.date === expenseDate)?.entries
                    ? Object.values(safeRecords.find((record) => record.date === expenseDate).entries)
                        .filter(isExpenseEntry)
                        .reduce((sum, entry) => sum + Number(entry.value || 0), 0)
                    : 0
                ).toFixed(2)}</strong>
              </div>
            </div>

            <form className="custom-event-form" onSubmit={addExpenseForDate}>
              <h3>Add expense for {expenseDate || 'selected date'}</h3>
              <div className="form-row">
                <input
                  type="date"
                  name="expenseDate"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
                <input type="text" name="expenseLabel" placeholder="Movie, outside food, groceries..." />
                <input type="number" name="expenseValue" min="0" step="0.01" placeholder="Amount" />
                <select name="expenseTag" defaultValue="Others">
                  {expenseTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <input type="text" name="customExpenseTag" placeholder="Custom tag" />
                <button type="submit">Add expense</button>
              </div>
            </form>

            <div className="history-list">
              {(() => {
                const selectedDayRecord = safeRecords.find((record) => record.date === expenseDate);
                const expenseEntryList = selectedDayRecord
                  ? Object.values(selectedDayRecord.entries).filter(isExpenseEntry)
                  : [];

                if (!expenseEntryList.length) {
                  return <div className="history-card"><h3>{expenseDate || 'No date selected'}</h3><p>No expenses added for this date.</p></div>;
                }

                return (
                  <div className="history-card">
                    <h3>{expenseDate}</h3>
                    <ul>
                      {expenseEntryList.map((entry, index) => (
                        <li key={`${expenseDate}-${entry.label}-${index}`}>
                          <span>{entry.label}</span>
                          <strong>₹{Number(entry.value || 0).toFixed(2)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {selectedPage === 'expense-history' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Expenses</p>
                <h2>Expense month</h2>
              </div>

              <label className="date-picker">
                <span>Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>
            </div>

            <div className="stat-cards">
              <div className="stat-card accent">
                <span>Total spend</span>
                <strong>₹{totalExpense.toFixed(2)}</strong>
              </div>
            </div>

            <div className="history-list">
              {dayEntries
                .filter((record) => record.date.startsWith(selectedMonth))
                .map((record) => {
                  const expenseEntries = Object.values(record.entries).filter(isExpenseEntry);

                  if (!expenseEntries.length) {
                    return null;
                  }

                  const dailyTotal = expenseEntries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

                  return (
                    <div key={record.date} className="history-card">
                      <h3>{record.date}</h3>
                      <ul>
                        {expenseEntries.map((entry, index) => (
                          <li key={`${record.date}-${entry.label}-${index}`}>
                            <span>{entry.label}</span>
                            <strong>₹{Number(entry.value || 0).toFixed(2)}</strong>
                          </li>
                        ))}
                      </ul>
                      <p className="daily-expense-total">Daily total: ₹{dailyTotal.toFixed(2)}</p>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {selectedPage === 'history' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Timeline</p>
                <h2>Daily history</h2>
              </div>
              <button type="button" className="export-button" onClick={exportCsv}>
                Export to Excel
              </button>
            </div>

            <div className="history-list">
              {dayEntries
                .map((record) => {
                  const visibleEntries = Object.values(record.entries).filter((entry) => entry.type !== 'amount');

                  if (!visibleEntries.length) {
                    return null;
                  }

                  return (
                    <div key={record.date} className="history-card">
                      <h3>{record.date}</h3>
                      <ul>
                        {visibleEntries.map((entry, index) => (
                          <li key={`${record.date}-${entry.label}-${index}`}>
                            <span>{entry.label}</span>
                            <strong>
                              {entry.type === 'checkbox'
                                ? entry.value
                                  ? 'Yes'
                                  : 'No'
                                : entry.type === 'text'
                                  ? entry.value || '—'
                                  : typeof entry.value === 'number'
                                    ? entry.value
                                    : entry.value || 0}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {selectedPage === 'weight' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Health</p>
                <h2>Weight trend</h2>
              </div>

              <label className="date-picker">
                <span>Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>
            </div>

            <div className="stat-cards">
              <div className="stat-card">
                <span>Average weight</span>
                <strong>{avgWeight ? `${avgWeight.toFixed(1)} kg` : 'No data'}</strong>
              </div>
              <div className="stat-card accent">
                <span>Weight range</span>
                <strong>{weightValues.length ? `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg` : 'No data'}</strong>
              </div>
            </div>

            <div className="weight-trend-wrap">
              {weightValues.length ? (
                <div className="weight-table-wrap">
                  <table className="expense-table weight-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Weight</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightValues.map((item, index) => {
                        const previous = index > 0 ? weightValues[index - 1].value : null;
                        const diff = previous === null ? 0 : item.value - previous;
                        const trendText = previous === null ? 'Start' : diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                        const trendClass = previous === null ? 'neutral' : diff >= 0 ? 'gain' : 'loss';

                        return (
                          <tr key={item.date}>
                            <td>{item.date}</td>
                            <td>{item.value.toFixed(1)} kg</td>
                            <td className={`trend-cell ${trendClass}`}>{trendText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="history-card">
                  <h3>No weight data</h3>
                  <p>No weight entries found for this month.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {selectedPage === 'monthly' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Summary</p>
                <h2>Monthly statistics</h2>
              </div>

              <label className="date-picker">
                <span>Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>
            </div>

            <div className="stat-cards">
              <div className="stat-card">
                <span>Water glasses</span>
                <strong>{waterTotal}</strong>
              </div>
              <div className="stat-card">
                <span>Steps total</span>
                <strong>{stepTotal.toLocaleString()}</strong>
              </div>
              <div className="stat-card">
                <span>DSA solved</span>
                <strong>{dsaTotal}</strong>
              </div>
              <div className="stat-card">
                <span>Start vs today</span>
                <strong className={monthWeightDeltaClass === 'gain' ? 'trend-positive' : monthWeightDeltaClass === 'loss' ? 'trend-negative' : ''}>{monthWeightDeltaText}</strong>
              </div>
              <div className="stat-card accent">
                <span>Expense total</span>
                <strong>₹{totalExpense.toFixed(2)}</strong>
              </div>
            </div>

            <div className="summary-box">
              <h3>Mandatory event summary</h3>
              <div className="summary-grid">
                {summaryRows.map((row) => (
                  <div key={row.label} className="summary-card">
                    <span>{row.label}</span>
                    <strong>{row.count}</strong>
                    <small>{row.meta}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-section">
              <h3>Weight by day</h3>
              {weightValues.length ? (
                <div className="bar-chart">
                  {weightValues.map((item) => (
                    <div key={item.date} className="bar-row">
                      <div className="bar-labels">
                        <span>{item.date}</span>
                        <strong>{item.value.toFixed(1)} kg</strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill weight-fill"
                          style={{ width: `${((item.value - minWeight) / (maxWeight - minWeight || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No weight data for this month yet.</p>
              )}

              <h3>Expense by tag</h3>
              <div className="expense-table-wrap">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseByTag.length ? (
                      expenseByTag.map(([tag, amount]) => (
                        <tr key={tag}>
                          <td>{tag}</td>
                          <td>₹{amount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2">No expense data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bar-chart">
                {expenseByTag.length ? (
                  expenseByTag.map(([tag, amount]) => (
                    <div key={tag} className="bar-row">
                      <div className="bar-labels">
                        <span>{tag}</span>
                        <strong>₹{amount.toFixed(2)}</strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${maxExpenseTagValue ? (amount / maxExpenseTagValue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No chart data yet</p>
                )}
              </div>
            </div>

            <div className="mini-list">
              <h3>Water by day</h3>
              <ul>
                {monthRecords
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((record) => (
                    <li key={record.date}>
                      <span>{record.date}</span>
                      <strong>{Number(record.entries.water?.value || 0)} glasses</strong>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

/*
  MongoDB idea for later:
  const saveToMongo = async (payload) => {
    const response = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  };
*/
