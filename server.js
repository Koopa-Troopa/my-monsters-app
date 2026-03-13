const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'))

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'msm',
    password: 'KoopaTheGamer54!',
    port: 5433
});

app.get('/api/combinations', async (req, res) => {
    try {
        const result = await pool.query(` 
            SELECT 
                p1.monster_name AS parent_1, 
                p2.monster_name AS parent_2, 
                r.monster_name AS result
            FROM combinations
            JOIN monsters AS p1 ON combinations.parent1_id = p1.monster_id
            JOIN monsters AS p2 ON combinations.parent2_id = p2.monster_id
            JOIN monsters AS r  ON combinations.result_id   = r.monster_id;
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/monsters/:id', async (req, res) => {
    try {
        const monsterId = req.params.id;
        
        
        await pool.query('DELETE FROM combinations WHERE parent1_id = $1 OR parent2_id = $1 OR result_id = $1', [monsterId]);
        
        
        await pool.query('DELETE FROM monster_elements WHERE monster_id = $1', [monsterId]);
        
      
        const result = await pool.query(
            'DELETE FROM monsters WHERE monster_id = $1 RETURNING *',
            [monsterId]
        );
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Monster not found' });
        } else {
            res.json({ message: 'Monster deleted', monster_name: result.rows[0] });
        }
    } catch (err) {
        console.error("Delete Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/monsters', async (req, res) => {
    try {
        const { monster_name, class_name, incubation_time } = req.body;
        if (!monster_name || !class_name) {
            return res.status(400).json({ error: "Enter name and class." });
        }

        const result = await pool.query(
            'INSERT INTO monsters (monster_name, class, incubation_time) VALUES ($1, $2, $3) RETURNING *', 
            [monster_name, class_name, incubation_time]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/combinations', async (req, res) => {
    const { parent1_id, parent2_id, result_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO combinations (parent1_id, parent2_id, result_id) VALUES ($1, $2, $3) RETURNING *',
            [parent1_id, parent2_id, result_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reset-monsters', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM combinations');
        await client.query('DELETE FROM monster_elements');
        await client.query('DELETE FROM monsters');
        const everyone = [
            ['Noggin', 'Natural', 0.0014], ['Mammott', 'Natural', 0.033], ['Toe Jammer', 'Natural', 0.017],
            ['Potbelly', 'Natural', 0.033], ['Tweedle', 'Natural', 0.066], ['Drumpler', 'Natural', 0.5],
            ['Fwog', 'Natural', 0.5], ['Maw', 'Natural', 0.5], ['Shrubb', 'Natural', 8],
            ['Furcorn', 'Natural', 8], ['Oaktopus', 'Natural', 8], ['Pango', 'Natural', 8],
            ['Quibble', 'Natural', 8], ['Cybop', 'Natural', 8], ['Dandidoo', 'Natural', 8],
            ['T-Rox', 'Natural', 8], ['Bowgart', 'Natural', 12], ['Clamble', 'Natural', 12],
            ['Pummel', 'Natural', 12], ['Reedling', 'Natural', 12], ['Spunge', 'Natural', 12],
            ['Thumpies', 'Natural', 12], ['Congle', 'Natural', 12], ['PomPom', 'Natural', 12],
            ['Scups', 'Natural', 12], ['Entbrat', 'Natural', 24], ['Deedge', 'Natural', 24],
            ['Riff', 'Natural', 24], ['Shellbeat', 'Natural', 24], ['Quarrister', 'Natural', 24],
            ['Gjoob', 'Mythical', 18], ['Strombonin', 'Mythical', 23], ['Yawstrich', 'Mythical', 28],
            ['Anglow', 'Mythical', 33], ['Hyehehe', 'Mythical', 28], ['Cataliszt', 'Dream', 9],
            ['Bleatnik', 'Dreamythical', 27], ['Cranchee', 'Dreamythical', 32], ['Sporerow', 'Dreamythical', 37],
            ['Pinghound', 'Dreamythical', 42], ['Wheezel', 'Dreamythical', 37], ['Punkleton', 'Seasonal', 18],
            ['Yool', 'Seasonal', 36], ['Schmoochle', 'Seasonal', 31], ['Blabbit', 'Seasonal', 19],
            ['Hoola', 'Seasonal', 25], ['Gobbleygourd', 'Seasonal', 21], ['Clavavera', 'Seasonal', 22],
            ['Viveine', 'Seasonal', 22], ['Jam Boree', 'Seasonal', 40], ['Carillong', 'Seasonal', 27],
            ['Whiz-bang', 'Seasonal', 27], ['Monculus', 'Seasonal', 27], ['Ffidyll', 'Seasonal', 22],
            ['Booqwurm', 'Seasonal', 31], ['Spurrit', 'Seasonal', 25]
        ];
        for (const [name, clas, time] of everyone) {
            await client.query(
                'INSERT INTO monsters (monster_name, class, incubation_time) VALUES ($1, $2, $3)',
                [name, clas, time]
            );
        }
        const elementMap = {
            'Noggin': ['Earth'],
            'Mammott': ['Cold'],
            'Toe Jammer': ['Water'],
            'Potbelly': ['Plant'],
            'Tweedle': ['Air'],
            'Drumpler': ['Earth','Cold'],
            'Fwog': ['Earth','Water'],
            'Maw': ['Water','Cold'],
            'Shrubb': ['Plant','Earth'],
            'Furcorn': ['Plant','Cold'],
            'Oaktopus': ['Plant','Water'],
            'Pango': ['Cold','Air'],
            'Quibble': ['Air','Cold'],
            'Cybop': ['Air','Water'],
            'Dandidoo': ['Plant','Air'],
            'T-Rox': ['Earth','Water','Cold'],
            'Bowgart': ['Plant','Water','Cold'],
            'Clamble': ['Plant','Air','Earth'],
            'Pummel': ['Water','Earth','Cold'],
            'Reedling': ['Plant','Water','Air'],
            'Spunge': ['Cold','Air','Water'],
            'Thumpies': ['Cold','Air','Earth'],
            'Congle': ['Cold','Air','Water'],
            'PomPom': ['Air','Water','Earth'],
            'Scups': ['Water','Air','Earth'],
            'Entbrat': ['Plant','Earth','Water','Cold'],
            'Deedge': ['Cold','Air','Water','Earth'],
            'Riff': ['Air','Earth','Water','Cold'],
            'Shellbeat': ['Water','Earth','Air','Cold'],
            'Quarrister': ['Earth','Cold','Air','Water'],
            'Gjoob': ['Mythical'],
            'Strombonin': ['Mythical'],
            'Yawstrich': ['Mythical'],
            'Anglow': ['Mythical'],
            'Hyehehe': ['Mythical'],
            'Cataliszt': ['Mythical','Dream'],
            'Bleatnik': ['Mythical','Dream'],
            'Cranchee': ['Mythical','Dream'],
            'Sporerow': ['Mythical','Dream'],
            'Pinghound': ['Mythical','Dream'],
            'Wheezel': ['Mythical','Dream'],
            'Punkleton': ['Seasonal'],
            'Yool': ['Seasonal'],
            'Schmoochle': ['Seasonal'],
            'Blabbit': ['Seasonal'],
            'Hoola': ['Seasonal'],
            'Gobbleygourd': ['Seasonal'],
            'Clavavera': ['Seasonal'],
            'Viveine': ['Seasonal'],
            'Jam Boree': ['Seasonal'],
            'Carillong': ['Seasonal'],
            'Whiz-bang': ['Seasonal'],
            'Monculus': ['Seasonal'],
            'Ffidyll': ['Seasonal'],
            'Booqwurm': ['Seasonal'],
            'Spurrit': ['Seasonal']
    };
    for (const monster in elementMap) {
        const monsterRes = await client.query(
            `SELECT monster_id FROM monsters WHERE monster_name = $1`,
            [monster]
        );
        const monsterId = monsterRes.rows[0].monster_id;
        for (const element of elementMap[monster]) {
            const elementRes = await client.query(
                `SELECT element_id FROM elements WHERE element_name = $1`,
                [element]
            );
        const elementId = elementRes.rows[0].element_id;
        await client.query(
            `INSERT INTO monster_elements (monster_id, element_id) VALUES ($1,$2)`,
            [monsterId, elementId]
        );
    }
} 
        await client.query('COMMIT');
        res.json({ message: "All monsters restored." });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/monsters', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.monster_id,
                m.monster_name,
                m.class,
                m.incubation_time,
                STRING_AGG(e.element_name, ', ') AS elements
            FROM monsters m
            LEFT JOIN monster_elements me ON m.monster_id = me.monster_id
            LEFT JOIN elements e ON me.element_id = e.element_id
            GROUP BY m.monster_id
            ORDER BY m.monster_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));