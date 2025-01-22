import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const EMPTY = 0;
const WALL = 1;
const START = 2;
const END = 3;
// const PATH = 4;
// const VISITED = 5;

const MicromouseSimulator = () => {
    const [size, setSize] = useState({ rows: 10, cols: 10 });
    const [maze, setMaze] = useState([]);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [mousePosition, setMousePosition] = useState(null);
    const [path, setPath] = useState([]);
    const [bfsNumbers, setBfsNumbers] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [currentMode, setCurrentMode] = useState("wall");

    useEffect(() => {
        initializeMaze();
    }, [size]);

    const initializeMaze = () => {
        const newMaze = Array(size.rows)
            .fill(null)
            .map(() => Array(size.cols).fill(EMPTY));
        setMaze(newMaze);
        setStart(null);
        setEnd(null);
        setMousePosition(null);
        setPath([]);
        setBfsNumbers([]);
    };

    const handleCellClick = (row, col) => {
        if (isSimulating) return;

        const newMaze = [...maze];

        if (currentMode === "start") {
            if (start) newMaze[start.row][start.col] = EMPTY;
            setStart({ row, col });
            newMaze[row][col] = START;
        } else if (currentMode === "end") {
            if (end) newMaze[end.row][end.col] = EMPTY;
            setEnd({ row, col });
            newMaze[row][col] = END;
        } else if (currentMode === "wall") {
            newMaze[row][col] = newMaze[row][col] === WALL ? EMPTY : WALL;
        }

        setMaze(newMaze);
    };

    const bfs = () => {
        if (!start || !end) return null;

        const queue = [{ ...start, distance: 0 }];
        const visited = Array(size.rows).fill(null).map(() => Array(size.cols).fill(false));
        const distances = Array(size.rows).fill(null).map(() => Array(size.cols).fill(Infinity));

        distances[start.row][start.col] = 0;

        while (queue.length > 0) {
            const { row, col, distance } = queue.shift();

            if (visited[row][col]) continue;
            visited[row][col] = true;


            const directions = [
                [-1, 0], // Up
                [1, 0],  // Down
                [0, -1], // Left
                [0, 1],  // Right
            ];

            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;

                if (
                    newRow >= 0 &&
                    newRow < size.rows &&
                    newCol >= 0 &&
                    newCol < size.cols &&
                    maze[newRow][newCol] !== WALL &&
                    !visited[newRow][newCol]
                ) {

                    if (distances[newRow][newCol] > distance + 1) {
                        distances[newRow][newCol] = distance + 1;
                        queue.push({ row: newRow, col: newCol, distance: distance + 1 });
                    }
                }
            }
        }

        setBfsNumbers(distances);
        return distances;
    };


    const findPath = (distances) => {
        if (!start || !end) return [];

        const path = [];
        let current = { ...end };

        while (current.row !== start.row || current.col !== start.col) {
            path.push(current);

            const directions = [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
            ];
            let bestDirection = null;
            let minDistance = Infinity;

            for (const [dx, dy] of directions) {
                const newRow = current.row + dx;
                const newCol = current.col + dy;
                if (
                    newRow >= 0 &&
                    newRow < size.rows &&
                    newCol >= 0 &&
                    newCol < size.cols &&
                    distances[newRow][newCol] < minDistance
                ) {
                    minDistance = distances[newRow][newCol];
                    bestDirection = { row: newRow, col: newCol };
                }
            }

            if (!bestDirection) break;
            current = bestDirection;
        }

        path.push(start);
        return path.reverse();
    };

    const startSimulation = () => {
        if (!start || !end || isSimulating) return;

        setIsSimulating(true);
        const distances = bfs();

        if (distances) {
            const shortestPath = findPath(distances);
            if (shortestPath.length > 0) {
                setPath(shortestPath);


                let step = 0;
                const intervalId = setInterval(() => {
                    if (step < shortestPath.length) {
                        setMousePosition(shortestPath[step]);
                        step++;
                    } else {
                        clearInterval(intervalId);
                        setIsSimulating(false);
                    }
                }, 500);
            } else {
                setIsSimulating(false);
                alert("No valid path found!");
            }
        } else {
            setIsSimulating(false);
            alert("No valid path found!");
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className="flex space-x-4">
                <input
                    type="number"
                    value={size.rows}

                    onChange={(e) => {
                        const value = e.target.value;
                        setSize({
                            ...size,
                            rows: value === "" ? "" : Math.max(5, Math.min(20, parseInt(value, 10) || 0)),
                        });
                    }}
                    className="border p-2"
                    min="5"
                    max="20"
                />
                <input
                    type="number"
                    value={size.cols}

                    onChange={(e) => {
                        const value = e.target.value;
                        setSize({
                          ...size,
                          cols: value === "" ? "" : Math.max(5, Math.min(20, parseInt(value, 10) || 0)),
                        });
                      }}
                    className="border p-2"
                    min="5"
                    max="20"
                />
                <Button onClick={initializeMaze}>Reset Maze</Button>
            </div>
            <div className="flex space-x-4">
                <Button
                    onClick={() => setCurrentMode("start")}
                    variant={currentMode === "start" ? "default" : "outline"}
                >
                    Set Start
                </Button>
                <Button
                    onClick={() => setCurrentMode("end")}
                    variant={currentMode === "end" ? "default" : "outline"}
                >
                    Set End
                </Button>
                <Button
                    onClick={() => setCurrentMode("wall")}
                    variant={currentMode === "wall" ? "default" : "outline"}
                >
                    Set Walls
                </Button>
                <Button onClick={startSimulation} disabled={!start || !end || isSimulating}>
                    Start Simulation
                </Button>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${size.cols}, 40px)`,
                    gap: "1px",
                }}
            >
                {maze.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor:
                                    mousePosition?.row === rowIndex && mousePosition?.col === colIndex
                                        ? "red"
                                        : cell === WALL
                                            ? "black"
                                            : cell === START
                                                ? "green"
                                                : cell === END
                                                    ? "blue"
                                                    : path.some((p) => p.row === rowIndex && p.col === colIndex)
                                                        ? "yellow"
                                                        : "white",
                                border: "1px solid #ccc",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "12px",
                                color: cell === WALL ? "white" : "black",
                            }}
                        >
                            {bfsNumbers[rowIndex]?.[colIndex] !== Infinity &&
                                bfsNumbers[rowIndex]?.[colIndex]}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MicromouseSimulator;
